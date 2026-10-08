"""Order management API."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from business_operations.db.session import get_db
from business_operations.repositories.customer import get_customer
from business_operations.repositories.order import (
    create_order,
    delete_order,
    get_order,
    get_order_by_number,
    list_orders,
    update_order,
)
from business_operations.schemas.order import (
    OrderCreate,
    OrderList,
    OrderRead,
    OrderUpdate,
)

router = APIRouter(
    prefix="/api/v1/orders",
    tags=["Orders"],
)

DatabaseSession = Annotated[Session, Depends(get_db)]


@router.post(
    "",
    response_model=OrderRead,
    status_code=status.HTTP_201_CREATED,
)
def create_order_endpoint(
    order_data: OrderCreate,
    db: DatabaseSession,
) -> OrderRead:
    """Create a new customer order."""
    customer = get_customer(
        db,
        order_data.customer_id,
    )

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )

    return create_order(db, order_data)


@router.get(
    "",
    response_model=OrderList,
)
def list_orders_endpoint(
    db: DatabaseSession,
    search: str | None = Query(
        default=None,
        max_length=100,
    ),
    order_status: str | None = Query(
        default=None,
        alias="status",
        pattern="^(pending|confirmed|processing|shipped|completed|cancelled)$",
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
) -> OrderList:
    """List orders with optional search and status filters."""
    orders, total = list_orders(
        db,
        limit=limit,
        offset=offset,
        search=search,
        status=order_status,
    )

    return OrderList(
        items=orders,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/number/{order_number}",
    response_model=OrderRead,
)
def get_order_by_number_endpoint(
    order_number: str,
    db: DatabaseSession,
) -> OrderRead:
    """Return one order by its human-readable order number."""
    order = get_order_by_number(
        db,
        order_number,
    )

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found.",
        )

    return order


@router.get(
    "/{order_id}",
    response_model=OrderRead,
)
def get_order_endpoint(
    order_id: int,
    db: DatabaseSession,
) -> OrderRead:
    """Return one order by ID."""
    order = get_order(
        db,
        order_id,
    )

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found.",
        )

    return order


@router.patch(
    "/{order_id}",
    response_model=OrderRead,
)
def update_order_endpoint(
    order_id: int,
    order_data: OrderUpdate,
    db: DatabaseSession,
) -> OrderRead:
    """Update an existing order."""
    order = get_order(
        db,
        order_id,
    )

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found.",
        )

    return update_order(
        db,
        order,
        order_data,
    )


@router.delete(
    "/{order_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_order_endpoint(
    order_id: int,
    db: DatabaseSession,
) -> Response:
    """Delete an order."""
    order = get_order(
        db,
        order_id,
    )

    if order is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found.",
        )

    delete_order(
        db,
        order,
    )

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )