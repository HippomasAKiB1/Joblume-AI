import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.models.resume_v2 import ResumeV2
from app.services.master_profile_service import MasterProfileService
from app.services.resume_view_service import ResumeViewService
from app.services.resume_version_service import ResumeVersionService
from app.schemas.schemas import (
    MasterProfileResponse,
    MasterProfileUpdateRequest,
    ResumeViewCreateRequest,
    ResumeViewUpdateRequest,
    ResumeViewSummaryResponse,
    ResumeViewDetailResponse,
    ContentOverridesUpdateRequest,
    ResumeVersionCreateRequest,
    ResumeVersionDetailResponse,
    ResumeVersionSummaryResponse,
    ResumeRestoreResponse,
)

router = APIRouter(tags=["v2 - Master Profile & Resumes"])


async def build_view_detail_response(
    db: AsyncSession, view: ResumeV2, user_id: str
) -> ResumeViewDetailResponse:
    """Helper to assemble a ResumeViewDetailResponse including live resolved_data."""
    master = await MasterProfileService.get_profile(db, user_id)
    resolved_data = ResumeViewService.resolve_view_data(view, master)
    resp = ResumeViewDetailResponse.model_validate(view)
    resp.resolved_data = resolved_data
    return resp


# ── Profile Endpoints ──────────────────────────────────────────

@router.get("/profile", response_model=MasterProfileResponse)
async def get_master_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetch user's canonical Master Profile (lazy-creates default if absent)."""
    profile = await MasterProfileService.get_profile(db, current_user.id)
    return MasterProfileResponse.model_validate(profile)


@router.put("/profile", response_model=MasterProfileResponse)
async def update_master_profile(
    req: MasterProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update fields in user's Master Profile with automatic item UUID minting."""
    profile = await MasterProfileService.update_profile(db, current_user.id, req)
    return MasterProfileResponse.model_validate(profile)


# ── Resume View Endpoints ─────────────────────────────────────

@router.get("/resumes", response_model=List[ResumeViewSummaryResponse])
async def list_resume_views(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all Resume Views belonging to the authenticated user."""
    views = await ResumeViewService.list_views(db, current_user.id)
    return [ResumeViewSummaryResponse.model_validate(v) for v in views]


@router.post("/resumes", response_model=ResumeViewDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_resume_view(
    req: ResumeViewCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new Resume View referencing Master Profile."""
    view = await ResumeViewService.create_view(db, current_user.id, req)
    return await build_view_detail_response(db, view, current_user.id)


@router.get("/resumes/{id}", response_model=ResumeViewDetailResponse)
async def get_resume_view(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetch a single Resume View with its live resolved resume data contract."""
    view = await ResumeViewService.get_view(db, id, current_user.id)
    return await build_view_detail_response(db, view, current_user.id)


@router.put("/resumes/{id}", response_model=ResumeViewDetailResponse)
async def update_resume_view(
    id: uuid.UUID,
    req: ResumeViewUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update view configuration (styling, ordering, visibility, entry selection)."""
    view = await ResumeViewService.update_view(db, id, current_user.id, req)
    return await build_view_detail_response(db, view, current_user.id)


@router.put("/resumes/{id}/overrides", response_model=ResumeViewDetailResponse)
async def update_resume_overrides(
    id: uuid.UUID,
    req: ContentOverridesUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Merge content overrides for tailoring entries without mutating Master Profile."""
    view = await ResumeViewService.apply_overrides(db, id, current_user.id, req.content_overrides)
    return await build_view_detail_response(db, view, current_user.id)


@router.delete("/resumes/{id}")
async def delete_resume_view(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a Resume View and cascade delete its historical versions."""
    await ResumeViewService.delete_view(db, id, current_user.id)
    return {"message": "Resume view deleted"}


# ── Version Snapshots & Restoration ───────────────────────────

@router.get("/resumes/{id}/versions", response_model=List[ResumeVersionSummaryResponse])
async def list_resume_versions(
    id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List historical version snapshots of a Resume View."""
    versions = await ResumeVersionService.list_versions(db, id, current_user.id)
    return [ResumeVersionSummaryResponse.model_validate(v) for v in versions]


@router.post("/resumes/{id}/versions", response_model=ResumeVersionDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_resume_version(
    id: uuid.UUID,
    req: ResumeVersionCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create an immutable snapshot of the resolved resume view."""
    version = await ResumeVersionService.create_snapshot(
        db, id, current_user.id, label=req.label, note=req.note
    )
    return ResumeVersionDetailResponse.model_validate(version)


@router.post("/resumes/{id}/versions/{vid}/restore", response_model=ResumeRestoreResponse)
async def restore_resume_version(
    id: uuid.UUID,
    vid: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Restore view configuration from a snapshot.
    Automatically creates a pre-restore checkpoint before applying changes.
    """
    view, checkpoint = await ResumeVersionService.restore_version(db, id, vid, current_user.id)
    view_detail = await build_view_detail_response(db, view, current_user.id)
    checkpoint_summary = ResumeVersionSummaryResponse.model_validate(checkpoint)
    return ResumeRestoreResponse(view=view_detail, pre_restore_checkpoint=checkpoint_summary)
