from sqlalchemy.orm import Session

from app.models import Department, IssueCategory


def route_to_department(db: Session, category: IssueCategory) -> Department | None:
    return db.query(Department).filter(Department.handles_category == category).first()
