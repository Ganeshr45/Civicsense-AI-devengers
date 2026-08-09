from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Department, Report, ReportStatus, User
from app.schemas import DashboardStats, DepartmentOut

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def stats(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    reports = db.query(Report).all()

    total = len(reports)
    resolved = [r for r in reports if r.status == ReportStatus.resolved]
    in_progress = [r for r in reports if r.status == ReportStatus.in_progress]
    submitted = [r for r in reports if r.status in (ReportStatus.submitted, ReportStatus.routed)]

    resolution_hours = []
    for r in resolved:
        if r.resolved_at and r.created_at:
            resolved_at = r.resolved_at.replace(tzinfo=timezone.utc) if r.resolved_at.tzinfo is None else r.resolved_at
            created_at = r.created_at.replace(tzinfo=timezone.utc) if r.created_at.tzinfo is None else r.created_at
            resolution_hours.append((resolved_at - created_at).total_seconds() / 3600)

    avg_resolution = round(sum(resolution_hours) / len(resolution_hours), 1) if resolution_hours else None

    by_category: dict[str, int] = {}
    by_severity: dict[str, int] = {}
    for r in reports:
        by_category[r.category.value] = by_category.get(r.category.value, 0) + 1
        by_severity[r.severity.value] = by_severity.get(r.severity.value, 0) + 1

    return DashboardStats(
        total_reports=total,
        resolved=len(resolved),
        in_progress=len(in_progress),
        submitted=len(submitted),
        avg_resolution_hours=avg_resolution,
        by_category=by_category,
        by_severity=by_severity,
    )


@router.get("/departments", response_model=list[DepartmentOut])
def departments(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Department).all()
