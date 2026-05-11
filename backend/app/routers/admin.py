from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.db.database import get_db
from app.models.user import User
from app.models.resume import Resume
from app.models.application import Application
from app.models.cover_letter import CoverLetter
from app.auth.dependencies import get_current_user
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/admin", tags=["Administration"])

# ── Admin Auth Dependency ─────────────────────────────────────

async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Secondary validation checkpoint confirming active user maintains superuser rights."""
    if not getattr(current_user, "is_admin", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Privilege escalation required: Operation restricted to platform administrators."
        )
    return current_user

# ── Return Contracts ──────────────────────────────────────────

class AdminStats(BaseModel):
    total_users: int
    total_resumes: int
    total_applications: int
    total_cover_letters: int

class AdminUserInfo(BaseModel):
    id: str
    full_name: str
    email: str
    is_admin: bool
    subscription_tier: str
    created_at: datetime
    resume_count: int
    application_count: int

# ── Endpoints ──────────────────────────────────────────────────

@router.get("/stats", response_model=AdminStats)
async def get_platform_stats(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin)
):
    """Retrieve global platform engagement metrics across all collections."""
    u_count = (await db.execute(select(func.count(User.id)))).scalar() or 0
    r_count = (await db.execute(select(func.count(Resume.id)))).scalar() or 0
    a_count = (await db.execute(select(func.count(Application.id)))).scalar() or 0
    cl_count = (await db.execute(select(func.count(CoverLetter.id)))).scalar() or 0

    return AdminStats(
        total_users=u_count,
        total_resumes=r_count,
        total_applications=a_count,
        total_cover_letters=cl_count
    )

@router.get("/users", response_model=list[AdminUserInfo])
async def list_all_users(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin)
):
    """Fetch full system registry with inline resource counting per profile."""
    # Query fetching user objects with their joined relationship counts
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    
    out = []
    for u in users:
        # Fetch resume & application counts for each manually since they're lazy loaded async
        r_res = await db.execute(select(func.count(Resume.id)).where(Resume.user_id == u.id))
        app_res = await db.execute(select(func.count(Application.id)).where(Application.user_id == u.id))
        
        out.append(AdminUserInfo(
            id=u.id,
            full_name=u.full_name,
            email=u.email,
            is_admin=u.is_admin,
            subscription_tier=u.subscription_tier,
            created_at=u.created_at,
            resume_count=r_res.scalar() or 0,
            application_count=app_res.scalar() or 0
        ))
    return out
