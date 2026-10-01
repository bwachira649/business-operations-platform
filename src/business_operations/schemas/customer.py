"""Customer API schemas."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class CustomerBase(BaseModel):
    """Shared customer fields."""

    name: str = Field(
        min_length=2,
        max_length=150,
    )

    email: EmailStr

    phone: str | None = Field(
        default=None,
        max_length=50,
    )

    company: str | None = Field(
        default=None,
        max_length=150,
    )

    status: str = Field(
        default="active",
        pattern="^(active|inactive|prospect)$",
    )

    notes: str | None = Field(
        default=None,
        max_length=5000,
    )


class CustomerCreate(CustomerBase):
    """Fields required to create a customer."""


class CustomerUpdate(BaseModel):
    """Fields that may be updated on a customer."""

    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    email: EmailStr | None = None

    phone: str | None = Field(
        default=None,
        max_length=50,
    )

    company: str | None = Field(
        default=None,
        max_length=150,
    )

    status: str | None = Field(
        default=None,
        pattern="^(active|inactive|prospect)$",
    )

    notes: str | None = Field(
        default=None,
        max_length=5000,
    )


class CustomerRead(CustomerBase):
    """Customer returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class CustomerList(BaseModel):
    """Paginated customer response."""

    items: list[CustomerRead]
    total: int
    limit: int
    offset: int