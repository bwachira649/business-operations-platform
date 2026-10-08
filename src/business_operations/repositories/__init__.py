"""Database repositories."""

from business_operations.repositories.customer import (
    create_customer,
    delete_customer,
    get_customer,
    get_customer_by_email,
    list_customers,
    update_customer,
)
from business_operations.repositories.inventory import (
    create_inventory_item,
    delete_inventory_item,
    get_inventory_by_sku,
    get_inventory_item,
    get_inventory_summary,
    list_inventory,
    update_inventory_item,
)
from business_operations.repositories.order import (
    create_order,
    delete_order,
    generate_order_number,
    get_order,
    get_order_by_number,
    get_order_totals,
    list_orders,
    update_order,
)

__all__ = [
    "create_customer",
    "create_inventory_item",
    "create_order",
    "delete_customer",
    "delete_inventory_item",
    "delete_order",
    "generate_order_number",
    "get_customer",
    "get_customer_by_email",
    "get_inventory_by_sku",
    "get_inventory_item",
    "get_inventory_summary",
    "get_order",
    "get_order_by_number",
    "get_order_totals",
    "list_customers",
    "list_inventory",
    "list_orders",
    "update_customer",
    "update_inventory_item",
    "update_order",
]
