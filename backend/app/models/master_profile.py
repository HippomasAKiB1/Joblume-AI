import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import String, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base


class MasterProfile(Base):
    __tablename__ = "master_profiles"

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
        unique=True,
        index=True,
    )
    personal_info: Mapped[Dict[str, Any]] = mapped_column(
        JSONB,
        nullable=False,
        default=lambda: {
            "fullName": "",
            "email": "",
            "phone": "",
            "location": "",
            "website": "",
            "linkedin": "",
            "github": "",
            "portfolio": "",
            "photo_url": None,
        },
    )
    summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    experience: Mapped[List[Dict[str, Any]]] = mapped_column(JSONB, nullable=False, default=list)
    education: Mapped[List[Dict[str, Any]]] = mapped_column(JSONB, nullable=False, default=list)
    projects: Mapped[List[Dict[str, Any]]] = mapped_column(JSONB, nullable=False, default=list)
    skills: Mapped[List[Dict[str, Any]]] = mapped_column(JSONB, nullable=False, default=list)
    certifications: Mapped[List[Dict[str, Any]]] = mapped_column(JSONB, nullable=False, default=list)
    languages: Mapped[List[Dict[str, Any]]] = mapped_column(JSONB, nullable=False, default=list)
    awards: Mapped[List[Dict[str, Any]]] = mapped_column(JSONB, nullable=False, default=list)
    custom_sections: Mapped[List[Dict[str, Any]]] = mapped_column(JSONB, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    user = relationship("User", back_populates="master_profile")
    resumes_v2 = relationship("ResumeV2", back_populates="master_profile", cascade="all, delete-orphan")
