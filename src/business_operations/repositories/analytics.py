"""Analytics database queries."""

from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from business_operations.models.customer import Customer
from business_operations.models.inventory import InventoryItem
from business_operations.models.order import Order


def get_business_analytics(db: Session) -> dict:
    """Return aggregate business analytics from live database data."""
    customers = int(
        db.scalar(select(func.count(Customer.id))) or 0
    )

    active_customers = int(
        db.scalar(
            select(func.count(Customer.id)).where(
                Customer.status == "active",
            )
        ) or 0
    )

    orders = int(
        db.scalar(select(func.count(Order.id))) or 0
    )

    completed_orders = int(
        db.scalar(
            select(func.count(Order.id)).where(
                Order.status == "completed",
            )
        ) or 0
    )

    pending_orders = int(
        db.scalar(
            select(func.count(Order.id)).where(
                Order.status == "pending",
            )
        ) or 0
    )

    revenue = db.scalar(
        select(
            func.coalesce(
                func.sum(Order.total_amount),
                0,
            )
        ).where(
            Order.status != "cancelled",
        )
    ) or Decimal("0")

    inventory_items = int(
        db.scalar(select(func.count(InventoryItem.id))) or 0
    )

    low_stock_items = int(
        db.scalar(
            select(func.count(InventoryItem.id)).where(
                InventoryItem.quantity <= InventoryItem.reorder_level,
                InventoryItem.status == "active",
            )
        ) or 0
    )

    total_units = int(
        db.scalar(
            select(
                func.coalesce(
                    func.sum(InventoryItem.quantity),
                    0,
                )
            )
        ) or 0
    )

    average_order_value = (
        Decimal(str(revenue)) / orders
        if orders
        else Decimal("0")
    )

    completion_rate = (
        (completed_orders / orders) * 100
        if orders
        else 0
    )

    return {
        "customers": customers,
        "active_customers": active_customers,
        "orders": orders,
        "completed_orders": completed_orders,
        "pending_orders": pending_orders,
        "revenue": str(Decimal(str(revenue)).quantize(Decimal("0.01"))),
        "average_order_value": str(
            Decimal(str(average_order_value)).quantize(
                Decimal("0.01")
            )
        ),
        "completion_rate": round(completion_rate, 1),
        "inventory_items": inventory_items,
        "low_stock_items": low_stock_items,
        "total_units": total_units,
    }


def get_revenue_trend(
    db: Session,
    *,
    days: int = 30,
) -> list[dict]:
    """Return daily revenue totals for the requested period."""
    start_date = datetime.utcnow() - timedelta(days=days - 1)

    rows = db.execute(
        select(
            func.date(Order.created_at).label("date"),
            func.coalesce(func.sum(Order.total_amount), 0).label("revenue"),
        )
        .where(
            Order.created_at >= start_date,
            Order.status != "cancelled",
        )
        .group_by(func.date(Order.created_at))
        .order_by(func.date(Order.created_at)),
    ).all()

    revenue_by_date = {
        str(row.date): Decimal(str(row.revenue))
        for row in rows
    }

    result = []

    for offset in range(days):
        current_date = (start_date + timedelta(days=offset)).date()
        date_key = str(current_date)

        result.append(
            {
                "date": date_key,
                "revenue": str(
                    revenue_by_date.get(
                        date_key,
                        Decimal("0"),
                    ).quantize(Decimal("0.01"))
                ),
            }
        )

    return result
