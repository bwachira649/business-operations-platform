"""Database operations for customers."""

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from business_operations.models.customer import Customer
from business_operations.schemas.customer import CustomerCreate, CustomerUpdate


def create_customer(
    db: Session,
    customer_data: CustomerCreate,
) -> Customer:
    """Create and persist a customer."""
    customer = Customer(**customer_data.model_dump())

    db.add(customer)
    db.commit()
    db.refresh(customer)

    return customer


def get_customer(
    db: Session,
    customer_id: int,
) -> Customer | None:
    """Return a customer by ID."""
    statement = select(Customer).where(Customer.id == customer_id)

    return db.scalar(statement)


def get_customer_by_email(
    db: Session,
    email: str,
) -> Customer | None:
    """Return a customer by email address."""
    statement = select(Customer).where(Customer.email == email)

    return db.scalar(statement)


def list_customers(
    db: Session,
    *,
    limit: int,
    offset: int,
    search: str | None = None,
    status: str | None = None,
) -> tuple[list[Customer], int]:
    """Return filtered customers and total count."""
    statement = select(Customer)

    if search:
        search_term = f"%{search.strip()}%"

        statement = statement.where(
            or_(
                Customer.name.ilike(search_term),
                Customer.email.ilike(search_term),
                Customer.company.ilike(search_term),
            )
        )

    if status:
        statement = statement.where(Customer.status == status)

    total_statement = select(func.count()).select_from(statement.subquery())

    total = db.scalar(total_statement) or 0

    statement = (
        statement
        .order_by(Customer.created_at.desc())
        .offset(offset)
        .limit(limit)
    )

    customers = list(db.scalars(statement).all())

    return customers, total


def update_customer(
    db: Session,
    customer: Customer,
    customer_data: CustomerUpdate,
) -> Customer:
    """Update a customer."""
    changes = customer_data.model_dump(exclude_unset=True)

    for field, value in changes.items():
        setattr(customer, field, value)

    db.commit()
    db.refresh(customer)

    return customer


def delete_customer(
    db: Session,
    customer: Customer,
) -> None:
    """Delete a customer."""
    db.delete(customer)
    db.commit()