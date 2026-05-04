from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date
from app.db.database import get_db
from app.models.user import User
from app.models.application import Application
from app.schemas.schemas import ApplicationCreateRequest, ApplicationUpdateRequest, ApplicationResponse
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.post("/create", response_model=ApplicationResponse)
async def create_application(
    req: ApplicationCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    app = Application(
        user_id=current_user.id,
        company=req.company,
        position=req.position,
        status=req.status,
        applied_date=date.fromisoformat(req.applied_date),
        notes=req.notes,
    )
    db.add(app)
    await db.flush()
    await db.refresh(app)
    resp = ApplicationResponse.model_validate(app)
    resp.applied_date = str(app.applied_date)
    return resp


@router.get("/list", response_model=list[ApplicationResponse])
async def list_applications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Application).where(Application.user_id == current_user.id).order_by(Application.created_at.desc())
    )
    apps = []
    for a in result.scalars().all():
        r = ApplicationResponse.model_validate(a)
        r.applied_date = str(a.applied_date)
        apps.append(r)
    return apps


@router.put("/{app_id}", response_model=ApplicationResponse)
async def update_application(
    app_id: str,
    req: ApplicationUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Application).where(Application.id == app_id, Application.user_id == current_user.id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if req.company is not None: app.company = req.company
    if req.position is not None: app.position = req.position
    if req.status is not None: app.status = req.status
    if req.applied_date is not None: app.applied_date = date.fromisoformat(req.applied_date)
    if req.notes is not None: app.notes = req.notes
    await db.flush()
    await db.refresh(app)
    r = ApplicationResponse.model_validate(app)
    r.applied_date = str(app.applied_date)
    return r


@router.delete("/{app_id}")
async def delete_application(
    app_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Application).where(Application.id == app_id, Application.user_id == current_user.id))
    app = result.scalar_one_or_none()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    await db.delete(app)
    return {"message": "Application deleted"}
