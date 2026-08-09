import io
import os

os.environ["DATABASE_URL"] = "sqlite:///./test_civicsense.db"

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.database import Base, engine
from app.main import app
from app.models import Department, IssueCategory

client = TestClient(app)


@pytest.fixture(autouse=True, scope="module")
def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    from app.database import SessionLocal

    db = SessionLocal()
    db.add(Department(name="Public Works", handles_category=IssueCategory.pothole))
    db.add(Department(name="Solid Waste", handles_category=IssueCategory.garbage))
    db.commit()
    db.close()
    yield
    if os.path.exists("test_civicsense.db"):
        os.remove("test_civicsense.db")


def make_test_image() -> bytes:
    img = Image.new("RGB", (200, 200), color=(90, 90, 90))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def get_token(phone="+919999900001"):
    r = client.post("/api/auth/request-otp", json={"phone": phone, "name": "Test User"})
    assert r.status_code == 200
    otp = r.json()["dev_otp"]
    r2 = client.post("/api/auth/verify-otp", json={"phone": phone, "code": otp})
    assert r2.status_code == 200
    return r2.json()["access_token"]


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_otp_flow_and_invalid_code():
    r = client.post("/api/auth/request-otp", json={"phone": "+919999900002", "name": "Alice"})
    assert r.status_code == 200

    bad = client.post("/api/auth/verify-otp", json={"phone": "+919999900002", "code": "000000"})
    assert bad.status_code == 400

    token = get_token("+919999900002")
    assert token

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["phone"] == "+919999900002"


def test_unauthenticated_report_rejected():
    r = client.post("/api/reports", data={"latitude": 12.9, "longitude": 77.6}, files={})
    assert r.status_code in (401, 422)


def test_create_report_and_track():
    token = get_token("+919999900003")
    headers = {"Authorization": f"Bearer {token}"}
    img_bytes = make_test_image()

    r = client.post(
        "/api/reports",
        headers=headers,
        data={"latitude": "12.9716", "longitude": "77.5946", "description": "Test pothole report"},
        files={"image": ("test.jpg", img_bytes, "image/jpeg")},
    )
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["status"] in ("submitted", "routed", "duplicate")
    assert body["category"] in [c.value for c in IssueCategory]
    assert 0.0 <= body["ai_confidence"] <= 1.0

    report_id = body["id"]
    get_r = client.get(f"/api/reports/{report_id}", headers=headers)
    assert get_r.status_code == 200
    assert len(get_r.json()["updates"]) >= 1


def test_invalid_coordinates_rejected():
    token = get_token("+919999900004")
    headers = {"Authorization": f"Bearer {token}"}
    img_bytes = make_test_image()

    r = client.post(
        "/api/reports",
        headers=headers,
        data={"latitude": "999", "longitude": "77.5946"},
        files={"image": ("test.jpg", img_bytes, "image/jpeg")},
    )
    assert r.status_code == 400


def test_dashboard_stats():
    token = get_token("+919999900005")
    headers = {"Authorization": f"Bearer {token}"}
    r = client.get("/api/dashboard/stats", headers=headers)
    assert r.status_code == 200
    data = r.json()
    assert "total_reports" in data
    assert "by_category" in data
