import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class UserRole(str, enum.Enum):
    citizen = "citizen"
    officer = "officer"
    admin = "admin"


class IssueCategory(str, enum.Enum):
    pothole = "pothole"
    garbage = "garbage"
    streetlight = "streetlight"
    water_leak = "water_leak"
    other = "other"


class Severity(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class ReportStatus(str, enum.Enum):
    submitted = "submitted"
    duplicate = "duplicate"
    routed = "routed"
    in_progress = "in_progress"
    resolved = "resolved"
    rejected = "rejected"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, nullable=False)
    phone = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=True)
    role = Column(Enum(UserRole), default=UserRole.citizen, nullable=False)
    department_id = Column(String, ForeignKey("departments.id"), nullable=True)
    created_at = Column(DateTime, default=utcnow)

    department = relationship("Department", back_populates="officers")
    reports = relationship("Report", back_populates="reporter", foreign_keys="Report.reporter_id")


class Department(Base):
    __tablename__ = "departments"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, unique=True, nullable=False)
    handles_category = Column(Enum(IssueCategory), nullable=False)
    contact_email = Column(String, nullable=True)

    officers = relationship("User", back_populates="department")
    reports = relationship("Report", back_populates="department")


class OTP(Base):
    __tablename__ = "otps"

    id = Column(String, primary_key=True, default=gen_uuid)
    phone = Column(String, nullable=False, index=True)
    code = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)


class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=gen_uuid)
    reporter_id = Column(String, ForeignKey("users.id"), nullable=False)

    description = Column(Text, nullable=True)
    image_path = Column(String, nullable=True)

    category = Column(Enum(IssueCategory), default=IssueCategory.other, nullable=False)
    severity = Column(Enum(Severity), default=Severity.medium, nullable=False)
    severity_score = Column(Float, default=0.0)
    ai_confidence = Column(Float, default=0.0)
    ai_source = Column(String, default="heuristic")  # "gemini" or "heuristic"

    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String, nullable=True)

    status = Column(Enum(ReportStatus), default=ReportStatus.submitted, nullable=False)
    duplicate_of_id = Column(String, ForeignKey("reports.id"), nullable=True)

    department_id = Column(String, ForeignKey("departments.id"), nullable=True)

    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)
    resolved_at = Column(DateTime, nullable=True)

    reporter = relationship("User", back_populates="reports", foreign_keys=[reporter_id])
    department = relationship("Department", back_populates="reports")
    updates = relationship(
        "StatusUpdate", back_populates="report", cascade="all, delete-orphan", order_by="StatusUpdate.created_at"
    )


class StatusUpdate(Base):
    __tablename__ = "status_updates"

    id = Column(String, primary_key=True, default=gen_uuid)
    report_id = Column(String, ForeignKey("reports.id"), nullable=False)
    status = Column(Enum(ReportStatus), nullable=False)
    note = Column(String, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    report = relationship("Report", back_populates="updates")
