"""Business reporting API."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from business_operations.db.session import get_db
from business_operations.repositories.reports import get_business_report

router = APIRouter(
    prefix="/api/v1/reports",
    tags=["Reports"],
)

DatabaseSession = Annotated[Session, Depends(get_db)]


@router.get("/business-performance")
def business_performance_report_endpoint(
    db: DatabaseSession,
    days: int = Query(
        default=30,
        ge=7,
        le=365,
    ),
) -> dict:
    """Return a live business performance report."""
    return get_business_report(
        db,
        days=days,
    )
