"""Business analytics API."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from business_operations.db.session import get_db
from business_operations.repositories.analytics import (
    get_business_analytics,
    get_revenue_trend,
)

router = APIRouter(
    prefix="/api/v1/analytics",
    tags=["Analytics"],
)

DatabaseSession = Annotated[Session, Depends(get_db)]


@router.get("/summary")
def analytics_summary_endpoint(
    db: DatabaseSession,
) -> dict:
    """Return live business analytics."""
    return get_business_analytics(db)


@router.get("/revenue-trend")
def revenue_trend_endpoint(
    db: DatabaseSession,
    days: int = 30,
) -> list[dict]:
    """Return daily revenue totals."""
    if days not in (7, 30, 90, 365):
        days = 30

    return get_revenue_trend(
        db,
        days=days,
    )
