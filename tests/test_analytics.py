"""Tests for the Analytics API."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from business_operations.main import app
from business_operations.models.customer import Customer
from business_operations.models.inventory import InventoryItem
from business_operations.models.order import Order

client = TestClient(app)


def test_analytics_summary_empty() -> None:
    """Return zero metrics for an empty database."""
    response = client.get("/api/v1/analytics/summary")

    assert response.status_code == 200

    data = response.json()

    assert data["customers"] == 0
    assert data["active_customers"] == 0
    assert data["orders"] == 0
    assert data["completed_orders"] == 0
    assert data["pending_orders"] == 0
    assert data["revenue"] == "0.00"
    assert data["average_order_value"] == "0.00"
    assert data["completion_rate"] == 0
    assert data["inventory_items"] == 0
    assert data["low_stock_items"] == 0
    assert data["total_units"] == 0


def test_analytics_summary_with_business_data(db_session: Session) -> None:
    """Calculate analytics from isolated test data."""
    customer = Customer(
        name="Analytics Customer",
        email="analytics@example.com",
        company="Analytics Co",
        status="active",
    )

    db_session.add(customer)
    db_session.commit()
    db_session.refresh(customer)

    db_session.add(
        Order(
            order_number="ORD-ANALYTICS-001",
            customer_id=customer.id,
            total_amount=1000,
            currency="USD",
            status="completed",
        )
    )

    db_session.add(
        Order(
            order_number="ORD-ANALYTICS-002",
            customer_id=customer.id,
            total_amount=500,
            currency="USD",
            status="pending",
        )
    )

    db_session.add(
        InventoryItem(
            sku="ANALYTICS-001",
            name="Analytics Product",
            category="Test",
            quantity=5,
            reorder_level=10,
            unit_price=25,
            status="active",
        )
    )

    db_session.commit()

    response = client.get("/api/v1/analytics/summary")

    assert response.status_code == 200

    data = response.json()

    assert data["customers"] == 1
    assert data["active_customers"] == 1
    assert data["orders"] == 2
    assert data["completed_orders"] == 1
    assert data["pending_orders"] == 1
    assert data["revenue"] == "1500.00"
    assert data["average_order_value"] == "750.00"
    assert data["completion_rate"] == 50.0
    assert data["inventory_items"] == 1
    assert data["low_stock_items"] == 1
    assert data["total_units"] == 5