from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.user import User
from app.models.resume import Resume
from app.schemas.schemas import ResumeCreateRequest, ResumeUpdateRequest, ResumeResponse
from app.auth.dependencies import get_current_user
from app.services.pdf_generator import generate_pdf, generate_docx

router = APIRouter(prefix="/resume", tags=["Resumes"])


@router.post("/create", response_model=ResumeResponse)
async def create_resume(
    req: ResumeCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    resume = Resume(user_id=current_user.id, title=req.title, template_name=req.template_name, json_data=req.json_data)
    db.add(resume)
    await db.flush()
    await db.refresh(resume)
    return ResumeResponse.model_validate(resume)


@router.get("/list", response_model=list[ResumeResponse])
async def list_resumes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Resume).where(Resume.user_id == current_user.id).order_by(Resume.updated_at.desc()))
    return [ResumeResponse.model_validate(r) for r in result.scalars().all()]


@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id))
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return ResumeResponse.model_validate(resume)


@router.put("/{resume_id}", response_model=ResumeResponse)
async def update_resume(
    resume_id: str,
    req: ResumeUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id))
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    if req.title is not None:
        resume.title = req.title
    if req.template_name is not None:
        resume.template_name = req.template_name
    if req.json_data is not None:
        resume.json_data = req.json_data
    await db.flush()
    await db.refresh(resume)
    return ResumeResponse.model_validate(resume)


@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id))
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    await db.delete(resume)
    return {"message": "Resume deleted"}


@router.get("/{resume_id}/export/pdf")
async def export_pdf(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id))
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    pdf_bytes = generate_pdf(resume.json_data)
    return Response(content=pdf_bytes, media_type="application/pdf",
                    headers={"Content-Disposition": f'attachment; filename="{resume.title}.pdf"'})


@router.get("/{resume_id}/export/docx")
async def export_docx(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id))
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    docx_bytes = generate_docx(resume.json_data)
    return Response(content=docx_bytes,
                    media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    headers={"Content-Disposition": f'attachment; filename="{resume.title}.docx"'})
