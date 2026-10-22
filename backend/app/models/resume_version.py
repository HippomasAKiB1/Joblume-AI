import uuid
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy import String, Integer, DateTime, ForeignKey, Text, func, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.database import Base


class ResumeVersion(Base):
    __tablename__ = "resume_versions"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        server_default=func.gen_random_uuid(),
    )
    resume_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("resumes_v2.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    label: Mapped[str] = mapped_column(String(255), nullable=False, default="Manual Save")
    change_source: Mapped[str] = mapped_column(String(50), nullable=False, default="manual")
    snapshot_data: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False)
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    resume_v2 = relationship("ResumeV2", back_populates="versions")

    __table_args__ = (
        UniqueConstraint("resume_id", "version_number", name="uq_resume_version_number"),
    )
