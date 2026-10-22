import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import String, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base


DEFAULT_SECTION_ORDER = [
    "personal",
    "summary",
    "experience",
    "education",
    "skills",
    "projects",
    "certifications",
    "languages",
    "awards",
    "custom_sections",
]

DEFAULT_SECTION_VISIBILITY = {
    "personal": True,
    "summary": True,
    "experience": True,
    "education": True,
    "skills": True,
    "projects": True,
    "certifications": True,
    "languages": True,
    "awards": True,
    "custom_sections": True,
}


class ResumeV2(Base):
    __tablename__ = "resumes_v2"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    master_profile_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("master_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False, default="Untitled Resume")
    template_id: Mapped[str] = mapped_column(String(100), nullable=False, default="modern-professional")
    primary_color: Mapped[str] = mapped_column(String(30), nullable=False, default="#4F46E5")
    font_family: Mapped[str] = mapped_column(String(50), nullable=False, default="Inter")
    section_order: Mapped[List[str]] = mapped_column(
        JSONB,
        nullable=False,
        default=lambda: list(DEFAULT_SECTION_ORDER),
    )
    section_visibility: Mapped[Dict[str, bool]] = mapped_column(
        JSONB,
        nullable=False,
        default=lambda: dict(DEFAULT_SECTION_VISIBILITY),
    )
    selected_entry_ids: Mapped[Dict[str, List[str]]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
    )
    content_overrides: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
    )
    target_job_title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    target_company: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    user = relationship("User")
    master_profile = relationship("MasterProfile", back_populates="resumes_v2")
    versions = relationship(
        "ResumeVersion",
        back_populates="resume_v2",
        cascade="all, delete-orphan",
        order_by="desc(ResumeVersion.version_number)",
    )
