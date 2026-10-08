"""Inventory API schemas."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class InventoryBase(BaseModel):
    """Shared inventory fields."""

    sku: str = Field(
        min_length=2,
        max_length=50,
    )

    name: str = Field(
        min_length=2,
        max_length=150,
    )

    category: str | None = Field(
        default=None,
        max_length=100,
    )

    quantity: int = Field(
        default=0,
        ge=0,
    )

    reorder_level: int = Field(
        default=10,
        ge=0,
    )

    unit_price: Decimal = Field(
        gt=0,
        max_digits=12,
        decimal_places=2,
    )

    status: str = Field(
        default="active",
        pattern="^(active|inactive)$",
    )

    description: str | None = Field(
        default=None,
        max_length=5000,
    )


class InventoryCreate(InventoryBase):
    """Fields required to create an inventory item."""


class InventoryUpdate(BaseModel):
    """Fields that may be updated on an inventory item."""

    sku: str | None = Field(
        default=None,
        min_length=2,
        max_length=50,
    )

    name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    category: str | None = Field(
        default=None,
        max_length=100,
    )

    quantity: int | None = Field(
        default=None,
        ge=0,
    )

    reorder_level: int | None = Field(
        default=None,
        ge=0,
    )

    unit_price: Decimal | None = Field(
        default=None,
        gt=0,
        max_digits=12,
        decimal_places=2,
    )

    status: str | None = Field(
        default=None,
        pattern="^(active|inactive)$",
    )

    description: str | None = Field(
        default=None,
        max_length=5000,
    )


class InventoryRead(InventoryBase):
    """Inventory item returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime


class InventoryList(BaseModel):
    """Paginated inventory response."""

    items: list[InventoryRead]
    total: int
    limit: int
    offset: int
