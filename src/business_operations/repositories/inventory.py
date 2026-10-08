"""Database operations for inventory."""

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from business_operations.models.inventory import InventoryItem
from business_operations.schemas.inventory import InventoryCreate, InventoryUpdate


def create_inventory_item(
    db: Session,
    item_data: InventoryCreate,
) -> InventoryItem:
    """Create and persist an inventory item."""
    item = InventoryItem(**item_data.model_dump())

    db.add(item)
    db.commit()
    db.refresh(item)

    return item


def get_inventory_item(
    db: Session,
    item_id: int,
) -> InventoryItem | None:
    """Return an inventory item by ID."""
    statement = select(InventoryItem).where(
        InventoryItem.id == item_id,
    )

    return db.scalar(statement)


def get_inventory_by_sku(
    db: Session,
    sku: str,
) -> InventoryItem | None:
    """Return an inventory item by SKU."""
    statement = select(InventoryItem).where(
        InventoryItem.sku == sku,
    )

    return db.scalar(statement)


def list_inventory(
    db: Session,
    *,
    limit: int,
    offset: int,
    search: str | None = None,
    status: str | None = None,
    low_stock: bool = False,
) -> tuple[list[InventoryItem], int]:
    """Return filtered inventory items and total count."""
    statement = select(InventoryItem)

    if search:
        search_term = f"%{search.strip()}%"

        statement = statement.where(
            or_(
                InventoryItem.sku.ilike(search_term),
                InventoryItem.name.ilike(search_term),
                InventoryItem.category.ilike(search_term),
            )
        )

    if status:
        statement = statement.where(
            InventoryItem.status == status,
        )

    if low_stock:
        statement = statement.where(
            InventoryItem.quantity <= InventoryItem.reorder_level,
        )

    total_statement = select(func.count()).select_from(
        statement.subquery(),
    )

    total = db.scalar(total_statement) or 0

    statement = (
        statement
        .order_by(InventoryItem.created_at.desc())
        .offset(offset)
        .limit(limit)
    )

    items = list(db.scalars(statement).all())

    return items, total


def update_inventory_item(
    db: Session,
    item: InventoryItem,
    item_data: InventoryUpdate,
) -> InventoryItem:
    """Update an inventory item."""
    changes = item_data.model_dump(exclude_unset=True)

    for field, value in changes.items():
        setattr(item, field, value)

    db.commit()
    db.refresh(item)

    return item


def delete_inventory_item(
    db: Session,
    item: InventoryItem,
) -> None:
    """Delete an inventory item."""
    db.delete(item)
    db.commit()


def get_inventory_summary(
    db: Session,
) -> dict[str, int]:
    """Return inventory dashboard metrics."""
    total = db.scalar(
        select(func.count(InventoryItem.id))
    ) or 0

    active = db.scalar(
        select(func.count(InventoryItem.id)).where(
            InventoryItem.status == "active",
        )
    ) or 0

    low_stock = db.scalar(
        select(func.count(InventoryItem.id)).where(
            InventoryItem.quantity <= InventoryItem.reorder_level,
            InventoryItem.status == "active",
        )
    ) or 0

    units = db.scalar(
        select(func.coalesce(func.sum(InventoryItem.quantity), 0))
    ) or 0

    return {
        "total_items": int(total),
        "active_items": int(active),
        "low_stock_items": int(low_stock),
        "total_units": int(units),
    }
