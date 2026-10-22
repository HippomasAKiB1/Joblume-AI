import uuid
import copy
from typing import Optional, List, Dict, Any
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.resume_v2 import ResumeV2, DEFAULT_SECTION_ORDER, DEFAULT_SECTION_VISIBILITY
from app.models.master_profile import MasterProfile
from app.schemas.schemas import ResumeViewCreateRequest, ResumeViewUpdateRequest
from app.services.master_profile_service import MasterProfileService


COLLECTION_SECTIONS = [
    "experience",
    "education",
    "projects",
    "skills",
    "certifications",
    "languages",
    "awards",
    "custom_sections",
]


class ResumeViewService:

    @classmethod
    async def create_view(
        cls, db: AsyncSession, user_id: str, req: ResumeViewCreateRequest
    ) -> ResumeV2:
        """Create a new Resume View referencing Master Profile."""
        if req.master_profile_id is not None:
            stmt = select(MasterProfile).where(MasterProfile.id == req.master_profile_id)
            master = (await db.execute(stmt)).scalar_one_or_none()
            if master is None or master.user_id != user_id:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid master_profile_id: master profile does not belong to user",
                )
            master_id = req.master_profile_id
        else:
            master = await MasterProfileService.get_or_create_profile(db, user_id)
            master_id = master.id

        view = ResumeV2(
            id=uuid.uuid4(),
            user_id=user_id,
            master_profile_id=master_id,
            title=req.title,
            template_id=req.template_id,
            primary_color=req.primary_color,
            font_family=req.font_family,
            section_order=list(DEFAULT_SECTION_ORDER),
            section_visibility=dict(DEFAULT_SECTION_VISIBILITY),
            selected_entry_ids={},
            content_overrides={},
            target_job_title=req.target_job_title,
            target_company=req.target_company,
        )
        db.add(view)
        await db.commit()
        await db.refresh(view)
        return view

    @classmethod
    async def get_view(cls, db: AsyncSession, view_id: uuid.UUID, user_id: str) -> ResumeV2:
        """Fetch resume view enforcing ownership (404 on mismatch)."""
        stmt = select(ResumeV2).where(ResumeV2.id == view_id)
        view = (await db.execute(stmt)).scalar_one_or_none()

        if view is None or view.user_id != user_id:
            raise HTTPException(status_code=404, detail="Resume view not found")

        return view

    @classmethod
    async def list_views(cls, db: AsyncSession, user_id: str) -> List[ResumeV2]:
        """List all resume views belonging to user ordered by updated_at desc."""
        stmt = (
            select(ResumeV2)
            .where(ResumeV2.user_id == user_id)
            .order_by(ResumeV2.updated_at.desc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @classmethod
    async def update_view(
        cls, db: AsyncSession, view_id: uuid.UUID, user_id: str, req: ResumeViewUpdateRequest
    ) -> ResumeV2:
        """Update view configuration fields with ownership validation."""
        view = await cls.get_view(db, view_id, user_id)

        if getattr(req, "title", None) is not None:
            view.title = req.title
        if getattr(req, "template_id", None) is not None:
            view.template_id = req.template_id
        if getattr(req, "primary_color", None) is not None:
            view.primary_color = req.primary_color
        if getattr(req, "font_family", None) is not None:
            view.font_family = req.font_family
        if getattr(req, "section_order", None) is not None:
            view.section_order = req.section_order
        if getattr(req, "section_visibility", None) is not None:
            merged_vis = dict(view.section_visibility or {})
            merged_vis.update(req.section_visibility)
            view.section_visibility = merged_vis
        if getattr(req, "selected_entry_ids", None) is not None:
            view.selected_entry_ids = req.selected_entry_ids
        if getattr(req, "target_job_title", None) is not None:
            view.target_job_title = req.target_job_title
        if getattr(req, "target_company", None) is not None:
            view.target_company = req.target_company

        await db.commit()
        await db.refresh(view)
        return view

    @classmethod
    async def apply_overrides(
        cls, db: AsyncSession, view_id: uuid.UUID, user_id: str, overrides: Dict[str, Any]
    ) -> ResumeV2:
        """Update content overrides with ownership validation."""
        view = await cls.get_view(db, view_id, user_id)
        current = copy.deepcopy(view.content_overrides or {})
        current.update(overrides)
        view.content_overrides = current

        await db.commit()
        await db.refresh(view)
        return view

    @classmethod
    async def delete_view(cls, db: AsyncSession, view_id: uuid.UUID, user_id: str) -> None:
        """Delete resume view with ownership validation."""
        view = await cls.get_view(db, view_id, user_id)
        await db.delete(view)
        await db.commit()

    @staticmethod
    def resolve_view_data(view: Any, master: Any) -> Dict[str, Any]:
        """
        The Resolution Engine.
        Merges Master Profile data, section ordering, visibility filters,
        item-level entry selection, and content overrides into a single
        concrete rendered resume dictionary matching §5.2 contract.
        """
        resolved: Dict[str, Any] = {}

        # 1. Metadata and Styling
        template_id = getattr(view, "template_id", "modern-professional")
        primary_color = getattr(view, "primary_color", "#4F46E5")
        font_family = getattr(view, "font_family", "Inter")

        resolved["template_id"] = template_id
        resolved["primary_color"] = primary_color
        resolved["font_family"] = font_family

        section_visibility = getattr(view, "section_visibility", {}) or {}
        section_order = getattr(view, "section_order", None) or list(DEFAULT_SECTION_ORDER)
        selected_entry_ids = getattr(view, "selected_entry_ids", {}) or {}
        content_overrides = getattr(view, "content_overrides", {}) or {}

        # 2. Personal Info (always included if visible)
        if section_visibility.get("personal", True):
            base_personal = copy.deepcopy(getattr(master, "personal_info", {}) or {})
            if "personal_info" in content_overrides and isinstance(content_overrides["personal_info"], dict):
                base_personal.update(content_overrides["personal_info"])
            resolved["personal_info"] = base_personal

        # 3. Summary (included if visible)
        if section_visibility.get("summary", True):
            base_summary = getattr(master, "summary", "") or ""
            if "summary" in content_overrides:
                base_summary = content_overrides["summary"]
            resolved["summary"] = base_summary

        # 4. Collection Sections
        for sec in COLLECTION_SECTIONS:
            # Check visibility
            if not section_visibility.get(sec, True):
                # Omit completely if hidden per §5.2 contract
                continue

            raw_items = getattr(master, sec, []) or []
            if not isinstance(raw_items, list):
                raw_items = []

            # Filter by selected_entry_ids if specified for this section
            allowed_ids = selected_entry_ids.get(sec)
            if allowed_ids is not None:
                # Set of string IDs
                allowed_set = set(str(i) for i in allowed_ids)
                filtered_items = [
                    item for item in raw_items
                    if isinstance(item, dict) and str(item.get("id")) in allowed_set
                ]
            else:
                filtered_items = raw_items

            resolved_items = []
            for item in filtered_items:
                if not isinstance(item, dict):
                    continue
                item_copy = copy.deepcopy(item)
                item_id = str(item_copy.get("id", ""))

                # Apply overrides for this item
                if item_id and item_id in content_overrides:
                    ov = content_overrides[item_id]
                    if isinstance(ov, dict):
                        for k, v in ov.items():
                            if k == "bullets" and isinstance(v, dict):
                                # Overriding bullets by bullet ID or index string
                                original_bullets = item_copy.get("bullets", [])
                                for idx, bullet in enumerate(original_bullets):
                                    if not isinstance(bullet, dict):
                                        continue
                                    b_id = str(bullet.get("id", ""))
                                    idx_key = str(idx)
                                    if b_id in v:
                                        bullet["text"] = v[b_id]
                                    elif idx_key in v:
                                        bullet["text"] = v[idx_key]
                            else:
                                item_copy[k] = v

                resolved_items.append(item_copy)

            resolved[sec] = resolved_items

        resolved["section_order"] = list(section_order)
        return resolved
