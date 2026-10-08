"""Customer management API."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from business_operations.db.session import get_db
from business_operations.repositories.customer import (
    create_customer,
    delete_customer,
    get_customer,
    get_customer_by_email,
    list_customers,
    update_customer,
)
from business_operations.schemas.customer import (
    CustomerCreate,
    CustomerList,
    CustomerRead,
    CustomerUpdate,
)

router = APIRouter(
    prefix="/api/v1/customers",
    tags=["Customers"],
)

DatabaseSession = Annotated[Session, Depends(get_db)]


@router.post(
    "",
    response_model=CustomerRead,
    status_code=status.HTTP_201_CREATED,
)
def create_customer_endpoint(
    customer_data: CustomerCreate,
    db: DatabaseSession,
) -> CustomerRead:
    """Create a new customer."""
    existing_customer = get_customer_by_email(
        db,
        customer_data.email,
    )

    if existing_customer:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A customer with this email already exists.",
        )

    return create_customer(db, customer_data)


@router.get(
    "",
    response_model=CustomerList,
)
def list_customers_endpoint(
    db: DatabaseSession,
    search: str | None = Query(
        default=None,
        max_length=100,
    ),
    customer_status: str | None = Query(
        default=None,
        alias="status",
        pattern="^(active|inactive|prospect)$",
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
) -> CustomerList:
    """List customers with optional search and status filters."""
    customers, total = list_customers(
        db,
        limit=limit,
        offset=offset,
        search=search,
        status=customer_status,
    )

    return CustomerList(
        items=customers,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{customer_id}",
    response_model=CustomerRead,
)
def get_customer_endpoint(
    customer_id: int,
    db: DatabaseSession,
) -> CustomerRead:
    """Return one customer."""
    customer = get_customer(db, customer_id)

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )

    return customer


@router.patch(
    "/{customer_id}",
    response_model=CustomerRead,
)
def update_customer_endpoint(
    customer_id: int,
    customer_data: CustomerUpdate,
    db: DatabaseSession,
) -> CustomerRead:
    """Update an existing customer."""
    customer = get_customer(db, customer_id)

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )

    if customer_data.email:
        existing_customer = get_customer_by_email(
            db,
            customer_data.email,
        )

        if (
            existing_customer
            and existing_customer.id != customer.id
        ):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A customer with this email already exists.",
            )

    try:
        return update_customer(
            db,
            customer,
            customer_data,
        )
    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Customer update conflicts with existing data.",
        ) from None


@router.delete(
    "/{customer_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_customer_endpoint(
    customer_id: int,
    db: DatabaseSession,
) -> Response:
    """Delete a customer when no orders reference the customer."""
    customer = get_customer(db, customer_id)

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found.",
        )

    if customer.orders:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Customer cannot be deleted because existing orders "
                "reference this customer."
            ),
        )

    delete_customer(db, customer)

    return Response(
        status_code=status.HTTP_204_NO_CONTENT,
    )