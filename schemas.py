from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models import IssueCategory, ReportStatus, Severity, UserRole


# ---------- Auth ----------

class OTPRequest(BaseModel):
    phone: str = Field(..., min_length=8, max_length=20)
    name: Optional[str] = None


class OTPVerify(BaseModel):
    phone: str
    code: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class UserOut(BaseModel):
    id: str
    name: str
    phone: str
    role: UserRole
    department_id: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- Departments ----------

class DepartmentOut(BaseModel):
    id: str
    name: str
    handles_category: IssueCategory

    class Config:
        from_attributes = True


# ---------- Reports ----------

class ReportCreate(BaseModel):
    description: Optional[str] = None
    latitude: float
    longitude: float
    address: Optional[str] = None


class StatusUpdateOut(BaseModel):
    id: str
    status: ReportStatus
    note: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ReportOut(BaseModel):
    id: str
    reporter_id: str
    description: Optional[str]
    image_path: Optional[str]
    category: IssueCategory
    severity: Severity
    severity_score: float
    ai_confidence: float
    ai_source: str
    latitude: float
    longitude: float
    address: Optional[str]
    status: ReportStatus
    duplicate_of_id: Optional[str]
    department_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime]
    updates: list[StatusUpdateOut] = []

    class Config:
        from_attributes = True


class ReportStatusChange(BaseModel):
    status: ReportStatus
    note: Optional[str] = None


class DashboardStats(BaseModel):
    total_reports: int
    resolved: int
    in_progress: int
    submitted: int
    avg_resolution_hours: Optional[float]
    by_category: dict[str, int]
    by_severity: dict[str, int]
