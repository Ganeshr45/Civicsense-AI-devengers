"""Real duplicate-report detection: haversine distance + text similarity."""

from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone
from difflib import SequenceMatcher
from typing import Optional

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import IssueCategory, Report, ReportStatus

settings = get_settings()

EARTH_RADIUS_M = 6371000.0


def haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * EARTH_RADIUS_M * math.asin(math.sqrt(a))


def text_similarity(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def find_duplicate(
    db: Session,
    category: IssueCategory,
    latitude: float,
    longitude: float,
    description: Optional[str],
) -> Optional[Report]:
    """Return the existing open report this new submission most likely duplicates, if any."""
    window_start = datetime.now(timezone.utc) - timedelta(hours=settings.duplicate_window_hours)

    candidates = (
        db.query(Report)
        .filter(
            Report.category == category,
            Report.status.notin_([ReportStatus.resolved, ReportStatus.rejected, ReportStatus.duplicate]),
            Report.created_at >= window_start,
        )
        .all()
    )

    best_match: Optional[Report] = None
    best_score = 0.0

    for candidate in candidates:
        distance = haversine_meters(latitude, longitude, candidate.latitude, candidate.longitude)
        if distance > settings.duplicate_radius_meters:
            continue
        sim = text_similarity(description or "", candidate.description or "")
        # Proximity alone is often enough for the same physical issue;
        # text similarity boosts confidence when descriptions also overlap.
        proximity_score = 1.0 - (distance / settings.duplicate_radius_meters)
        score = 0.7 * proximity_score + 0.3 * sim
        if score > best_score:
            best_score = score
            best_match = candidate

    if best_match and best_score >= 0.55:
        return best_match
    return None
