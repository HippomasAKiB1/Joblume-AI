import uuid
from typing import Optional, List, Tuple, Any, Dict
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.resume_v2 import ResumeV2
from app.models.master_profile import MasterProfile
from app.models.resume_version import ResumeVersion
from app.services.resume_view_service import ResumeViewService


class ResumeVersionService:

    @classmethod
    async def create_snapshot(
        cls,
        db: AsyncSession,
        view_id: uuid.UUID,
        user_id: str,
        label: str = "Manual Save",
        source: str = "manual",
        note: Optional[str] = None,
    ) -> ResumeVersion:
        """
        Create an immutable snapshot of the resolved resume view.
        Uses SELECT ... FOR UPDATE on parent resume row to serialize
        concurrent snapshot creation and eliminate version_number collisions.
        """
        # Step 1: Lock parent view row FOR UPDATE
        stmt = (
            select(ResumeV2)
            .where(ResumeV2.id == view_id, ResumeV2.user_id == user_id)
            .with_for_update()
        )
        res = await db.execute(stmt)
        view = res.scalar_one_or_none()
        if view is None:
            raise HTTPException(status_code=404, detail="Resume view not found")

        # Step 2: Fetch Master Profile and resolve view data
        master_stmt = select(MasterProfile).where(MasterProfile.id == view.master_profile_id)
        master = (await db.execute(master_stmt)).scalar_one_or_none()
        if master is None:
            raise HTTPException(status_code=404, detail="Master profile not found")

        resolved_data = ResumeViewService.resolve_view_data(view, master)

        # Store view config alongside resolved data for lossless restoration
        snapshot_payload = dict(resolved_data)
        snapshot_payload["_view_config"] = {
            "title": view.title,
            "template_id": view.template_id,
            "primary_color": view.primary_color,
            "font_family": view.font_family,
            "section_order": view.section_order,
            "section_visibility": view.section_visibility,
            "selected_entry_ids": view.selected_entry_ids,
            "content_overrides": view.content_overrides,
            "target_job_title": view.target_job_title,
            "target_company": view.target_company,
        }

        # Step 3: Compute strictly sequential next version number
        max_stmt = select(func.coalesce(func.max(ResumeVersion.version_number), 0) + 1).where(
            ResumeVersion.resume_id == view_id
        )
        next_ver = (await db.execute(max_stmt)).scalar_one()

        # Step 4: Insert immutable record
        version = ResumeVersion(
            id=uuid.uuid4(),
            resume_id=view_id,
            version_number=next_ver,
            label=label,
            change_source=source,
            snapshot_data=snapshot_payload,
            note=note,
        )
        db.add(version)
        await db.commit()
        await db.refresh(version)
        return version

    @classmethod
    async def restore_version(
        cls,
        db: AsyncSession,
        view_id: uuid.UUID,
        version_id: uuid.UUID,
        user_id: str,
    ) -> Tuple[ResumeV2, ResumeVersion]:
        """
        Restore view configuration and content overrides from historical snapshot.
        Automatically saves a pre-restore checkpoint (change_source='restore_checkpoint')
        before applying snapshot data, enabling full undo capability.
        """
        # Step 1: Lock parent view row FOR UPDATE
        stmt = (
            select(ResumeV2)
            .where(ResumeV2.id == view_id, ResumeV2.user_id == user_id)
            .with_for_update()
        )
        view = (await db.execute(stmt)).scalar_one_or_none()
        if view is None:
            raise HTTPException(status_code=404, detail="Resume view not found")

        # Step 2: Fetch target version and verify ownership
        ver_stmt = select(ResumeVersion).where(
            ResumeVersion.id == version_id,
            ResumeVersion.resume_id == view_id,
        )
        target_ver = (await db.execute(ver_stmt)).scalar_one_or_none()
        if target_ver is None:
            raise HTTPException(status_code=404, detail="Resume version not found")

        # Step 3: Create automatic pre-restore checkpoint
        master_stmt = select(MasterProfile).where(MasterProfile.id == view.master_profile_id)
        master = (await db.execute(master_stmt)).scalar_one_or_none()
        if master is None:
            raise HTTPException(status_code=404, detail="Master profile not found")

        current_resolved = ResumeViewService.resolve_view_data(view, master)
        current_payload = dict(current_resolved)
        current_payload["_view_config"] = {
            "title": view.title,
            "template_id": view.template_id,
            "primary_color": view.primary_color,
            "font_family": view.font_family,
            "section_order": view.section_order,
            "section_visibility": view.section_visibility,
            "selected_entry_ids": view.selected_entry_ids,
            "content_overrides": view.content_overrides,
            "target_job_title": view.target_job_title,
            "target_company": view.target_company,
        }

        max_stmt = select(func.coalesce(func.max(ResumeVersion.version_number), 0) + 1).where(
            ResumeVersion.resume_id == view_id
        )
        checkpoint_num = (await db.execute(max_stmt)).scalar_one()

        checkpoint = ResumeVersion(
            id=uuid.uuid4(),
            resume_id=view_id,
            version_number=checkpoint_num,
            label="Before restore",
            change_source="restore_checkpoint",
            snapshot_data=current_payload,
            note=f"Automatic checkpoint before restoring version {target_ver.version_number}",
        )
        db.add(checkpoint)
        await db.flush()

        # Step 4: Apply target snapshot data to view
        snapshot = target_ver.snapshot_data or {}
        cfg = snapshot.get("_view_config")
        if isinstance(cfg, dict):
            if "title" in cfg:
                view.title = cfg["title"]
            if "template_id" in cfg:
                view.template_id = cfg["template_id"]
            if "primary_color" in cfg:
                view.primary_color = cfg["primary_color"]
            if "font_family" in cfg:
                view.font_family = cfg["font_family"]
            if "section_order" in cfg:
                view.section_order = cfg["section_order"]
            if "section_visibility" in cfg:
                view.section_visibility = cfg["section_visibility"]
            if "selected_entry_ids" in cfg:
                view.selected_entry_ids = cfg["selected_entry_ids"]
            if "content_overrides" in cfg:
                view.content_overrides = cfg["content_overrides"]
            if "target_job_title" in cfg:
                view.target_job_title = cfg["target_job_title"]
            if "target_company" in cfg:
                view.target_company = cfg["target_company"]
        else:
            if "template_id" in snapshot:
                view.template_id = snapshot["template_id"]
            if "primary_color" in snapshot:
                view.primary_color = snapshot["primary_color"]
            if "font_family" in snapshot:
                view.font_family = snapshot["font_family"]
            if "section_order" in snapshot:
                view.section_order = snapshot["section_order"]

        await db.commit()
        await db.refresh(view)
        await db.refresh(checkpoint)
        return view, checkpoint

    @classmethod
    async def list_versions(
        cls, db: AsyncSession, view_id: uuid.UUID, user_id: str
    ) -> List[ResumeVersion]:
        """List historical versions of view enforcing ownership."""
        await ResumeViewService.get_view(db, view_id, user_id)
        stmt = (
            select(ResumeVersion)
            .where(ResumeVersion.resume_id == view_id)
            .order_by(ResumeVersion.version_number.desc())
        )
        res = await db.execute(stmt)
        return list(res.scalars().all())

    @classmethod
    async def get_version(
        cls, db: AsyncSession, view_id: uuid.UUID, version_id: uuid.UUID, user_id: str
    ) -> ResumeVersion:
        """Get single version enforcing ownership."""
        await ResumeViewService.get_view(db, view_id, user_id)
        stmt = select(ResumeVersion).where(
            ResumeVersion.id == version_id,
            ResumeVersion.resume_id == view_id,
        )
        ver = (await db.execute(stmt)).scalar_one_or_none()
        if ver is None:
            raise HTTPException(status_code=404, detail="Resume version not found")
        return ver
