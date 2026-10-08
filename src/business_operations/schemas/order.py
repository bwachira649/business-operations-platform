"""Order API schemas."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from business_operations.schemas.customer import CustomerRead


class OrderBase(BaseModel):
    """Shared order fields."""

    customer_id: int = Field(
        gt=0,
    )

    total_amount: Decimal = Field(
        gt=0,
        max_digits=12,
        decimal_places=2,
    )

    currency: str = Field(
        default="USD",
        min_length=3,
        max_length=3,
        pattern="^[A-Z]{3}$",
    )

    description: str | None = Field(
        default=None,
        max_length=5000,
    )


class OrderCreate(OrderBase):
    """Fields required to create an order."""


class OrderUpdate(BaseModel):
    """Fields that may be updated on an order."""

    status: str | None = Field(
        default=None,
        pattern="^(pending|confirmed|processing|shipped|completed|cancelled)$",
    )

    total_amount: Decimal | None = Field(
        default=None,
        gt=0,
        max_digits=12,
        decimal_places=2,
    )

    description: str | None = Field(
        default=None,
        max_length=5000,
    )


class OrderRead(OrderBase):
    """Order returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    order_number: str
    status: str
    created_at: datetime
    updated_at: datetime
    customer: CustomerRead


class OrderList(BaseModel):
    """Paginated order response."""

    items: list[OrderRead]
    total: int
    limit: int
    offset: int
