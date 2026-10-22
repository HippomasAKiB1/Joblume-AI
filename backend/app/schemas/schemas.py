import uuid
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, Any, List, Dict
from datetime import datetime


# ── Auth Schemas ──────────────────────────────────────────────

class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: str  # Loosened to str to accommodate designated non-email admin usernames
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6, max_length=128)


# ── User Schemas ──────────────────────────────────────────────

class UserResponse(BaseModel):
    id: str
    full_name: str
    email: str
    subscription_tier: str
    is_admin: bool
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


# ── Phase B.1: Master Profile & v2 Hierarchy Schemas ───────────

class PersonalInfoSchema(BaseModel):
    fullName: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    website: str = ""
    linkedin: str = ""
    github: str = ""
    portfolio: str = ""
    photo_url: Optional[str] = None


class SkillItemSchema(BaseModel):
    name: str
    tags: list[str] = Field(default_factory=list)


class BulletItemSchema(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    tags: list[str] = Field(default_factory=list)


class ExperienceItemSchema(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    company: str
    location: str = ""
    startDate: str = ""
    endDate: str = ""
    current: bool = False
    bullets: list[BulletItemSchema] = Field(default_factory=list)


class EducationItemSchema(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    institution: str
    degree: str
    field: str = ""
    startDate: str = ""
    endDate: str = ""
    gpa: str = ""


class ProjectItemSchema(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    technologies: str = ""
    link: str = ""


class CertificationItemSchema(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    issuer: str = ""
    date: str = ""
    url: str = ""


class LanguageItemSchema(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    level: str = ""


class AwardItemSchema(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    issuer: str = ""
    date: str = ""
    description: str = ""


class CustomSectionItemSchema(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str = ""
    subtitle: str = ""
    date: str = ""
    description: str = ""


class CustomSectionSchema(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    items: list[CustomSectionItemSchema] = Field(default_factory=list)


class MasterProfileResponse(BaseModel):
    id: uuid.UUID
    user_id: str
    personal_info: PersonalInfoSchema
    summary: str = ""
    experience: list[ExperienceItemSchema] = Field(default_factory=list)
    education: list[EducationItemSchema] = Field(default_factory=list)
    projects: list[ProjectItemSchema] = Field(default_factory=list)
    skills: list[SkillItemSchema] = Field(default_factory=list)
    certifications: list[CertificationItemSchema] = Field(default_factory=list)
    languages: list[LanguageItemSchema] = Field(default_factory=list)
    awards: list[AwardItemSchema] = Field(default_factory=list)
    custom_sections: list[CustomSectionSchema] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MasterProfileUpdateRequest(BaseModel):
    personal_info: Optional[PersonalInfoSchema] = None
    summary: Optional[str] = None
    experience: Optional[list[ExperienceItemSchema]] = None
    education: Optional[list[EducationItemSchema]] = None
    projects: Optional[list[ProjectItemSchema]] = None
    skills: Optional[list[SkillItemSchema]] = None
    certifications: Optional[list[CertificationItemSchema]] = None
    languages: Optional[list[LanguageItemSchema]] = None
    awards: Optional[list[AwardItemSchema]] = None
    custom_sections: Optional[list[CustomSectionSchema]] = None


class ResumeViewCreateRequest(BaseModel):
    title: str = Field(default="Untitled Resume", max_length=255)
    template_id: str = Field(default="modern-professional", max_length=100)
    master_profile_id: Optional[uuid.UUID] = None  # Optional; auto-links to user's profile if omitted
    primary_color: str = Field(default="#4F46E5", max_length=30)
    font_family: str = Field(default="Inter", max_length=50)
    target_job_title: Optional[str] = None
    target_company: Optional[str] = None


class ResumeViewUpdateRequest(BaseModel):
    title: Optional[str] = None
    template_id: Optional[str] = None
    primary_color: Optional[str] = None
    font_family: Optional[str] = None
    section_order: Optional[list[str]] = None
    section_visibility: Optional[dict[str, bool]] = None
    selected_entry_ids: Optional[dict[str, list[str]]] = None
    target_job_title: Optional[str] = None
    target_company: Optional[str] = None


class ResumeViewSummaryResponse(BaseModel):
    id: uuid.UUID
    user_id: str
    master_profile_id: uuid.UUID
    title: str
    template_id: str
    primary_color: str
    font_family: str
    target_job_title: Optional[str] = None
    target_company: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ResumeViewDetailResponse(BaseModel):
    id: uuid.UUID
    user_id: str
    master_profile_id: uuid.UUID
    title: str
    template_id: str
    primary_color: str
    font_family: str
    section_order: list[str]
    section_visibility: dict[str, bool]
    selected_entry_ids: dict[str, list[str]]
    content_overrides: dict[str, Any]
    target_job_title: Optional[str] = None
    target_company: Optional[str] = None
    resolved_data: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ContentOverridesUpdateRequest(BaseModel):
    content_overrides: dict[str, Any]


class ResumeVersionCreateRequest(BaseModel):
    label: str = Field(default="Manual Save", max_length=255)
    note: Optional[str] = None


class ResumeVersionSummaryResponse(BaseModel):
    id: uuid.UUID
    resume_id: uuid.UUID
    version_number: int
    label: str
    change_source: str
    note: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ResumeVersionDetailResponse(BaseModel):
    id: uuid.UUID
    resume_id: uuid.UUID
    version_number: int
    label: str
    change_source: str
    snapshot_data: dict[str, Any]
    note: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ResumeRestoreResponse(BaseModel):
    view: ResumeViewDetailResponse
    pre_restore_checkpoint: ResumeVersionSummaryResponse
