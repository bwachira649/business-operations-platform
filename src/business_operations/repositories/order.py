"""Database operations for orders."""

from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from business_operations.models.order import Order
from business_operations.schemas.order import OrderCreate, OrderUpdate


def generate_order_number() -> str:
    """Generate a unique human-readable order number."""
    timestamp = datetime.now(UTC).strftime("%Y%m%d%H%M%S%f")

    return f"ORD-{timestamp[-14:]}"


def create_order(
    db: Session,
    order_data: OrderCreate,
) -> Order:
    """Create and persist an order."""
    order = Order(
        order_number=generate_order_number(),
        **order_data.model_dump(),
    )

    db.add(order)
    db.commit()
    db.refresh(order)

    return order


def get_order(
    db: Session,
    order_id: int,
) -> Order | None:
    """Return an order by ID with its customer."""
    statement = (
        select(Order)
        .options(joinedload(Order.customer))
        .where(Order.id == order_id)
    )

    return db.scalar(statement)


def get_order_by_number(
    db: Session,
    order_number: str,
) -> Order | None:
    """Return an order by order number with its customer."""
    statement = (
        select(Order)
        .options(joinedload(Order.customer))
        .where(Order.order_number == order_number)
    )

    return db.scalar(statement)


def list_orders(
    db: Session,
    *,
    limit: int,
    offset: int,
    search: str | None = None,
    status: str | None = None,
) -> tuple[list[Order], int]:
    """Return filtered orders and total count."""
    statement = select(Order).options(joinedload(Order.customer))

    if search:
        search_term = f"%{search.strip()}%"

        statement = statement.where(
            or_(
                Order.order_number.ilike(search_term),
                Order.description.ilike(search_term),
            )
        )

    if status:
        statement = statement.where(Order.status == status)

    total_statement = select(func.count()).select_from(statement.subquery())

    total = db.scalar(total_statement) or 0

    statement = (
        statement
        .order_by(Order.created_at.desc())
        .offset(offset)
        .limit(limit)
    )

    orders = list(db.scalars(statement).all())

    return orders, total


def update_order(
    db: Session,
    order: Order,
    order_data: OrderUpdate,
) -> Order:
    """Update an order."""
    changes = order_data.model_dump(exclude_unset=True)

    for field, value in changes.items():
        setattr(order, field, value)

    db.commit()
    db.refresh(order)

    return order


def delete_order(
    db: Session,
    order: Order,
) -> None:
    """Delete an order."""
    db.delete(order)
    db.commit()


def get_order_totals(
    db: Session,
) -> dict[str, Decimal]:
    """Return aggregate order totals for dashboard metrics."""
    revenue_statement = select(
        func.coalesce(
            func.sum(Order.total_amount),
            0,
        )
    ).where(
        Order.status != "cancelled",
    )

    count_statement = select(
        func.count(Order.id),
    ).where(
        Order.status != "cancelled",
    )

    revenue = db.scalar(revenue_statement) or Decimal("0")
    count = db.scalar(count_statement) or 0

    return {
        "revenue": Decimal(str(revenue)),
        "orders": Decimal(str(count)),
    }
