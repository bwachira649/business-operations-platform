"""Business reporting database queries."""

from datetime import datetime, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from business_operations.models.customer import Customer
from business_operations.models.inventory import InventoryItem
from business_operations.models.order import Order
from business_operations.models.task import Task


def get_business_report(db: Session, *, days: int = 30) -> dict:
    """Return a business performance report from live database data."""
    start_date = datetime.utcnow() - timedelta(days=days - 1)

    orders = int(
        db.scalar(
            select(func.count(Order.id)).where(
                Order.created_at >= start_date,
            )
        )
        or 0
    )
    completed_orders = int(
        db.scalar(
            select(func.count(Order.id)).where(
                Order.created_at >= start_date,
                Order.status == "completed",
            )
        )
        or 0
    )
    pending_orders = int(
        db.scalar(
            select(func.count(Order.id)).where(
                Order.created_at >= start_date,
                Order.status == "pending",
            )
        )
        or 0
    )
    revenue = db.scalar(
        select(func.coalesce(func.sum(Order.total_amount), 0)).where(
            Order.created_at >= start_date,
            Order.status != "cancelled",
        )
    ) or Decimal("0")

    customers = int(db.scalar(select(func.count(Customer.id))) or 0)
    active_customers = int(
        db.scalar(
            select(func.count(Customer.id)).where(
                Customer.status == "active",
            )
        )
        or 0
    )

    inventory_items = int(db.scalar(select(func.count(InventoryItem.id))) or 0)
    low_stock_items = int(
        db.scalar(
            select(func.count(InventoryItem.id)).where(
                InventoryItem.quantity <= InventoryItem.reorder_level,
                InventoryItem.status == "active",
            )
        )
        or 0
    )
    total_units = int(
        db.scalar(
            select(
                func.coalesce(
                    func.sum(InventoryItem.quantity),
                    0,
                )
            )
        )
        or 0
    )
    inventory_value = db.scalar(
        select(
            func.coalesce(
                func.sum(
                    InventoryItem.quantity * InventoryItem.unit_price
                ),
                0,
            )
        ).where(
            InventoryItem.status == "active",
        )
    ) or Decimal("0")

    tasks = int(db.scalar(select(func.count(Task.id))) or 0)
    completed_tasks = int(
        db.scalar(
            select(func.count(Task.id)).where(
                Task.status == "completed",
            )
        )
        or 0
    )
    overdue_tasks = int(
        db.scalar(
            select(func.count(Task.id)).where(
                Task.due_date < datetime.utcnow().date(),
                Task.status != "completed",
            )
        )
        or 0
    )

    revenue = Decimal(str(revenue)).quantize(Decimal("0.01"))
    inventory_value = Decimal(str(inventory_value)).quantize(Decimal("0.01"))

    average_order_value = (
        revenue / orders if orders else Decimal("0")
    ).quantize(Decimal("0.01"))

    completion_rate = (
        (completed_orders / orders) * 100 if orders else 0
    )
    task_completion_rate = (
        (completed_tasks / tasks) * 100 if tasks else 0
    )

    return {
        "period_days": days,
        "period_start": start_date.date().isoformat(),
        "period_end": datetime.utcnow().date().isoformat(),
        "financial": {
            "revenue": str(revenue),
            "average_order_value": str(average_order_value),
        },
        "orders": {
            "total": orders,
            "completed": completed_orders,
            "pending": pending_orders,
            "completion_rate": round(completion_rate, 1),
        },
        "customers": {
            "total": customers,
            "active": active_customers,
        },
        "inventory": {
            "items": inventory_items,
            "total_units": total_units,
            "low_stock": low_stock_items,
            "stock_value": str(inventory_value),
        },
        "tasks": {
            "total": tasks,
            "completed": completed_tasks,
            "overdue": overdue_tasks,
            "completion_rate": round(task_completion_rate, 1),
        },
    }
