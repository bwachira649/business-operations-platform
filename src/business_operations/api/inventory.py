"""Inventory management API."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from business_operations.db.session import get_db
from business_operations.repositories.inventory import (
    create_inventory_item,
    delete_inventory_item,
    get_inventory_by_sku,
    get_inventory_item,
    get_inventory_summary,
    list_inventory,
    update_inventory_item,
)
from business_operations.schemas.inventory import (
    InventoryCreate,
    InventoryList,
    InventoryRead,
    InventoryUpdate,
)

router = APIRouter(
    prefix="/api/v1/inventory",
    tags=["Inventory"],
)

DatabaseSession = Annotated[Session, Depends(get_db)]


@router.post(
    "",
    response_model=InventoryRead,
    status_code=status.HTTP_201_CREATED,
)
def create_inventory_endpoint(
    item_data: InventoryCreate,
    db: DatabaseSession,
) -> InventoryRead:
    """Create a new inventory item."""
    if get_inventory_by_sku(db, item_data.sku):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An inventory item with this SKU already exists.",
        )

    return create_inventory_item(db, item_data)


@router.get(
    "",
    response_model=InventoryList,
)
def list_inventory_endpoint(
    db: DatabaseSession,
    search: str | None = Query(
        default=None,
        max_length=100,
    ),
    item_status: str | None = Query(
        default=None,
        alias="status",
        pattern="^(active|inactive)$",
    ),
    low_stock: bool = Query(
        default=False,
    ),
    limit: int = Query(
        default=25,
        ge=1,
        le=100,
    ),
    offset: int = Query(
        default=0,
        ge=0,
    ),
) -> InventoryList:
    """List inventory with optional filters."""
    items, total = list_inventory(
        db,
        limit=limit,
        offset=offset,
        search=search,
        status=item_status,
        low_stock=low_stock,
    )

    return InventoryList(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/summary",
)
def inventory_summary_endpoint(
    db: DatabaseSession,
) -> dict[str, int]:
    """Return inventory dashboard metrics."""
    return get_inventory_summary(db)


@router.get(
    "/{item_id}",
    response_model=InventoryRead,
)
def get_inventory_endpoint(
    item_id: int,
    db: DatabaseSession,
) -> InventoryRead:
    """Return one inventory item."""
    item = get_inventory_item(db, item_id)

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found.",
        )

    return item


@router.patch(
    "/{item_id}",
    response_model=InventoryRead,
)
def update_inventory_endpoint(
    item_id: int,
    item_data: InventoryUpdate,
    db: DatabaseSession,
) -> InventoryRead:
    """Update an inventory item."""
    item = get_inventory_item(db, item_id)

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found.",
        )

    if item_data.sku:
        existing_item = get_inventory_by_sku(
            db,
            item_data.sku,
        )

        if existing_item and existing_item.id != item.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An inventory item with this SKU already exists.",
            )

    try:
        return update_inventory_item(
            db,
            item,
            item_data,
        )
    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Inventory update conflicts with existing data.",
        ) from None


@router.delete(
    "/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_inventory_endpoint(
    item_id: int,
    db: DatabaseSession,
) -> Response:
    """Delete an inventory item."""
    item = get_inventory_item(db, item_id)

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found.",
        )

    delete_inventory_item(db, item)

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )
