from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# ── Auth Schemas ──────────────────────────────────────────────

class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


# ── User Schemas ──────────────────────────────────────────────

class UserResponse(BaseModel):
    id: str
    full_name: str
    email: str
    subscription_tier: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None


class SubscriptionUpgradeRequest(BaseModel):
    code: str = Field(..., min_length=1)


# ── Resume Schemas ────────────────────────────────────────────

class ResumeCreateRequest(BaseModel):
    title: str = Field(default="Untitled Resume", max_length=255)
    template_name: str = Field(default="modern-professional", max_length=100)
    json_data: dict = Field(default_factory=dict)


class ResumeUpdateRequest(BaseModel):
    title: Optional[str] = None
    template_name: Optional[str] = None
    json_data: Optional[dict] = None


class ResumeResponse(BaseModel):
    id: str
    user_id: str
    title: str
    template_name: str
    json_data: dict
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Cover Letter Schemas ──────────────────────────────────────

class CoverLetterCreateRequest(BaseModel):
    job_title: Optional[str] = None
    company_name: Optional[str] = None
    content: str


class CoverLetterResponse(BaseModel):
    id: str
    user_id: str
    job_title: Optional[str]
    company_name: Optional[str]
    content: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Application Schemas ───────────────────────────────────────

class ApplicationCreateRequest(BaseModel):
    company: str = Field(..., max_length=255)
    position: str = Field(..., max_length=255)
    status: str = Field(default="Applied")
    applied_date: str  # ISO date string YYYY-MM-DD
    notes: Optional[str] = None


class ApplicationUpdateRequest(BaseModel):
    company: Optional[str] = None
    position: Optional[str] = None
    status: Optional[str] = None
    applied_date: Optional[str] = None
    notes: Optional[str] = None


class ApplicationResponse(BaseModel):
    id: str
    user_id: str
    company: str
    position: str
    status: str
    applied_date: str
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ── ATS Report Schemas ────────────────────────────────────────

class ATSReportResponse(BaseModel):
    id: str
    user_id: str
    resume_id: str
    score: int
    suggestions: dict
    created_at: datetime

    class Config:
        from_attributes = True


# ── AI Schemas ────────────────────────────────────────────────

class ResumeRefineRequest(BaseModel):
    json_data: dict


class JobTailorRequest(BaseModel):
    resume_id: str
    job_description: str


class JobTailorResponse(BaseModel):
    match_score: int
    missing_keywords: list[str]
    optimized_summary: str
    improved_bullets: list[str]
    suggested_skills: list[str]


class CoverLetterGenerateRequest(BaseModel):
    resume_id: str
    job_title: str
    company_name: str
    job_description: str


class ATSScoreRequest(BaseModel):
    resume_id: str


class ATSScoreResponse(BaseModel):
    score: int
    formatting_issues: list[str]
    missing_keywords: list[str]
    weak_verbs: list[str]
    improvement_tips: list[str]
