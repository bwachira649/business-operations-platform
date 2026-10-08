"""API routers."""

from business_operations.api.customers import router as customers_router
from business_operations.api.inventory import router as inventory_router
from business_operations.api.orders import router as orders_router

__all__ = [
    "customers_router",
    "inventory_router",
    "orders_router",
]
