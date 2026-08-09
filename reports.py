import os
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.auth import get_current_user, require_role
from app.database import get_db
from app.models import Report, ReportStatus, StatusUpdate, User, UserRole
from app.schemas import ReportOut, ReportStatusChange
from app.services.ai_detection import classify_image
from app.services.duplicate_detection import find_duplicate
from app.services.routing import route_to_department

router = APIRouter(prefix="/api/reports", tags=["reports"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_IMAGE_BYTES = 8 * 1024 * 1024
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}


@router.post("", response_model=ReportOut, status_code=status.HTTP_201_CREATED)
async def create_report(
    latitude: float = Form(...),
    longitude: float = Form(...),
    address: str | None = Form(None),
    description: str | None = Form(None),
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
        raise HTTPException(status_code=400, detail="Invalid GPS coordinates")

    if image.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, or WEBP images are accepted")

    image_bytes = await image.read()
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=400, detail="Image too large (max 8MB)")
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty image upload")

    # AI classification (Gemini if configured, otherwise local heuristic --
    # see app/services/ai_detection.py). Never fails the request: any error
    # falls back to a low-confidence "other" classification.
    try:
        detection = classify_image(image_bytes)
    except Exception:
        from app.services.ai_detection import DetectionResult
        from app.models import IssueCategory, Severity

        detection = DetectionResult(IssueCategory.other, Severity.low, 10.0, 0.1, "heuristic", "classification failed")

    ext = os.path.splitext(image.filename or "upload.jpg")[1] or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(image_bytes)

    duplicate = find_duplicate(db, detection.category, latitude, longitude, description)

    report = Report(
        reporter_id=user.id,
        description=description,
        image_path=f"/uploads/{filename}",
        category=detection.category,
        severity=detection.severity,
        severity_score=detection.severity_score,
        ai_confidence=detection.confidence,
        ai_source=detection.source,
        latitude=latitude,
        longitude=longitude,
        address=address,
    )

    if duplicate:
        report.status = ReportStatus.duplicate
        report.duplicate_of_id = duplicate.id
    else:
        dept = route_to_department(db, detection.category)
        if dept:
            report.department_id = dept.id
            report.status = ReportStatus.routed
        else:
            report.status = ReportStatus.submitted

    db.add(report)
    db.flush()

    db.add(StatusUpdate(report_id=report.id, status=report.status, note="Report submitted"))
    db.commit()
    db.refresh(report)
    return report


@router.get("", response_model=list[ReportOut])
def list_reports(
    status_filter: ReportStatus | None = Query(None, alias="status"),
    department_id: str | None = None,
    mine: bool = False,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = db.query(Report)

    if mine or user.role == UserRole.citizen:
        query = query.filter(Report.reporter_id == user.id)
    elif user.role == UserRole.officer and user.department_id:
        query = query.filter(Report.department_id == user.department_id)

    if status_filter:
        query = query.filter(Report.status == status_filter)
    if department_id:
        query = query.filter(Report.department_id == department_id)

    return query.order_by(Report.severity_score.desc(), Report.created_at.desc()).all()


@router.get("/{report_id}", response_model=ReportOut)
def get_report(report_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if user.role == UserRole.citizen and report.reporter_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this report")
    return report


@router.patch("/{report_id}/status", response_model=ReportOut)
def update_status(
    report_id: str,
    payload: ReportStatusChange,
    db: Session = Depends(get_db),
    user: User = Depends(require_role("officer", "admin")),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.status = payload.status
    if payload.status == ReportStatus.resolved:
        from datetime import datetime, timezone

        report.resolved_at = datetime.now(timezone.utc)

    db.add(StatusUpdate(report_id=report.id, status=payload.status, note=payload.note))
    db.commit()
    db.refresh(report)
    return report
