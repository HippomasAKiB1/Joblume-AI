from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import get_db
from app.models.user import User
from app.models.resume import Resume
from app.models.cover_letter import CoverLetter
from app.models.ats_report import ATSReport
from app.schemas.schemas import (
    JobTailorRequest, JobTailorResponse,
    CoverLetterGenerateRequest, CoverLetterResponse, CoverLetterCreateRequest,
    ATSScoreRequest, ATSScoreResponse,
)
from app.auth.dependencies import get_current_user
from app.services import ai_service
from app.services.ats_scorer import score_resume
from app.services.file_parser import parse_uploaded_file

router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/tailor-job", response_model=JobTailorResponse)
async def tailor_job(
    req: JobTailorRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Resume).where(Resume.id == req.resume_id, Resume.user_id == current_user.id))
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    data = await ai_service.tailor_resume(resume.json_data, req.job_description)
    return JobTailorResponse(**data)


@router.post("/generate-cover-letter", response_model=CoverLetterResponse)
async def generate_cover_letter(
    req: CoverLetterGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Resume).where(Resume.id == req.resume_id, Resume.user_id == current_user.id))
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    content = await ai_service.generate_cover_letter(resume.json_data, req.job_title, req.company_name, req.job_description)
    cl = CoverLetter(user_id=current_user.id, job_title=req.job_title, company_name=req.company_name, content=content)
    db.add(cl)
    await db.flush()
    await db.refresh(cl)
    return CoverLetterResponse.model_validate(cl)


@router.post("/ats-score", response_model=ATSScoreResponse)
async def ats_score(
    req: ATSScoreRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Resume).where(Resume.id == req.resume_id, Resume.user_id == current_user.id))
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    data = score_resume(resume.json_data)
    report = ATSReport(user_id=current_user.id, resume_id=resume.id, score=data["score"], suggestions=data)
    db.add(report)
    await db.flush()
    return ATSScoreResponse(**data)


@router.post("/upload-jd")
async def upload_job_description(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    try:
        text = await parse_uploaded_file(file)
        return {"text": text}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
