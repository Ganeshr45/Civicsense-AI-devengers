"""Seeds departments, demo users, and realistic sample reports.

Run with: python -m app.seed
"""
import random
from datetime import datetime, timedelta, timezone

from app.database import Base, SessionLocal, engine
from app.models import (
    Department,
    IssueCategory,
    Report,
    ReportStatus,
    Severity,
    StatusUpdate,
    User,
    UserRole,
)

Base.metadata.create_all(bind=engine)

# Bengaluru-area coordinates for realistic demo geospatial spread
CENTER_LAT, CENTER_LNG = 12.9716, 77.5946

DEPARTMENTS = [
    ("Public Works Department", IssueCategory.pothole, "pwd@civicsense.demo"),
    ("Solid Waste Management", IssueCategory.garbage, "swm@civicsense.demo"),
    ("Electrical & Streetlighting", IssueCategory.streetlight, "electrical@civicsense.demo"),
    ("Water Supply & Sewerage Board", IssueCategory.water_leak, "water@civicsense.demo"),
    ("General Municipal Services", IssueCategory.other, "general@civicsense.demo"),
]

SAMPLE_DESCRIPTIONS = {
    IssueCategory.pothole: [
        "Large pothole in the middle of the road, causing traffic to swerve.",
        "Deep pothole near the bus stop, water collects after rain.",
        "Cracked road surface with multiple potholes over 20 meters.",
    ],
    IssueCategory.garbage: [
        "Garbage pile has not been collected for over a week.",
        "Overflowing dumpster attracting stray animals.",
        "Illegal dumping of construction debris on the roadside.",
    ],
    IssueCategory.streetlight: [
        "Streetlight has been off for 3 nights, area is very dark.",
        "Flickering streetlight near the park entrance.",
        "Damaged streetlight pole leaning over the footpath.",
    ],
    IssueCategory.water_leak: [
        "Water pipe burst, flooding the street.",
        "Continuous leakage from an underground pipe near the junction.",
        "Low-pressure valve leaking steadily onto the pavement.",
    ],
}


def rand_offset():
    return (random.uniform(-0.03, 0.03), random.uniform(-0.03, 0.03))


def run():
    db = SessionLocal()
    try:
        if db.query(Department).count() > 0:
            print("Database already seeded. Skipping.")
            return

        departments = {}
        for name, category, email in DEPARTMENTS:
            dept = Department(name=name, handles_category=category, contact_email=email)
            db.add(dept)
            db.flush()
            departments[category] = dept

        officer = User(
            name="Officer Priya Sharma",
            phone="+919876500001",
            email="priya.officer@civicsense.demo",
            role=UserRole.officer,
            department_id=departments[IssueCategory.pothole].id,
        )
        admin = User(
            name="Admin Ravi Kumar",
            phone="+919876500002",
            email="ravi.admin@civicsense.demo",
            role=UserRole.admin,
        )
        citizens = [
            User(name="Anita Desai", phone="+919876500010"),
            User(name="Vikram Rao", phone="+919876500011"),
            User(name="Fatima Sheikh", phone="+919876500012"),
            User(name="Suresh Iyer", phone="+919876500013"),
        ]
        db.add_all([officer, admin, *citizens])
        db.flush()

        now = datetime.now(timezone.utc)
        statuses_cycle = [
            ReportStatus.resolved,
            ReportStatus.in_progress,
            ReportStatus.routed,
            ReportStatus.resolved,
            ReportStatus.submitted,
        ]

        count = 0
        for category, descriptions in SAMPLE_DESCRIPTIONS.items():
            dept = departments[category]
            for i, desc in enumerate(descriptions):
                for j in range(3):  # multiple reports per description, spread over time & location
                    dlat, dlng = rand_offset()
                    created = now - timedelta(days=random.randint(0, 20), hours=random.randint(0, 23))
                    status = statuses_cycle[count % len(statuses_cycle)]
                    severity = random.choice(list(Severity))
                    severity_score = {"low": 20, "medium": 50, "high": 75, "critical": 92}[severity.value]

                    report = Report(
                        reporter_id=random.choice(citizens).id,
                        description=desc,
                        image_path=None,
                        category=category,
                        severity=severity,
                        severity_score=severity_score,
                        ai_confidence=round(random.uniform(0.6, 0.95), 2),
                        ai_source=random.choice(["gemini", "heuristic"]),
                        latitude=CENTER_LAT + dlat,
                        longitude=CENTER_LNG + dlng,
                        address=f"Ward {random.randint(1, 40)}, Bengaluru",
                        status=status,
                        department_id=dept.id,
                        created_at=created,
                        updated_at=created,
                    )
                    if status == ReportStatus.resolved:
                        report.resolved_at = created + timedelta(hours=random.randint(6, 96))

                    db.add(report)
                    db.flush()
                    db.add(StatusUpdate(report_id=report.id, status=ReportStatus.submitted, note="Report submitted", created_at=created))
                    if status != ReportStatus.submitted:
                        db.add(StatusUpdate(report_id=report.id, status=ReportStatus.routed, note=f"Routed to {dept.name}", created_at=created + timedelta(minutes=5)))
                    if status in (ReportStatus.in_progress, ReportStatus.resolved):
                        db.add(StatusUpdate(report_id=report.id, status=ReportStatus.in_progress, note="Field team dispatched", created_at=created + timedelta(hours=2)))
                    if status == ReportStatus.resolved:
                        db.add(StatusUpdate(report_id=report.id, status=ReportStatus.resolved, note="Issue resolved and verified", created_at=report.resolved_at))
                    count += 1

        db.commit()
        print(f"Seeded {len(DEPARTMENTS)} departments, {2 + len(citizens)} users, {count} reports.")
    finally:
        db.close()


if __name__ == "__main__":
    run()
