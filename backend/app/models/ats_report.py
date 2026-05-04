import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Integer, JSON, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base


class ATSReport(Base):
    __tablename__ = "ats_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    resume_id: Mapped[str] = mapped_column(String(36), ForeignKey("resumes.id"), nullable=False)
    score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    suggestions: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="ats_reports")
    resume = relationship("Resume", back_populates="ats_reports")
