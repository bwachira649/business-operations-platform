"""Tests for the Order API."""

from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from business_operations.db.session import Base, get_db
from business_operations.main import app

TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    bind=test_engine,
    autoflush=False,
    autocommit=False,
)

Base.metadata.create_all(bind=test_engine)


def override_get_db():
    """Provide a database session connected to the order test database."""
    db = TestingSessionLocal()

    try:
        yield db
    finally:
        db.close()


client = TestClient(app)


@pytest.fixture(autouse=True)
def use_order_test_database():
    """Use the order test database during each order test."""
    previous_override = app.dependency_overrides.get(get_db)

    app.dependency_overrides[get_db] = override_get_db

    try:
        yield
    finally:
        if previous_override is None:
            app.dependency_overrides.pop(get_db, None)
        else:
            app.dependency_overrides[get_db] = previous_override


def reset_database() -> None:
    """Clear all test tables before each test."""
    with TestingSessionLocal() as db:
        for table in reversed(Base.metadata.sorted_tables):
            db.execute(table.delete())

        db.commit()


def create_test_customer() -> int:
    """Create a customer required by order tests."""
    response = client.post(
        "/api/v1/customers",
        json={
            "name": "Order Test Customer",
            "email": "order.customer@example.com",
            "phone": "+254700000000",
            "company": "Order Test Ltd",
            "status": "active",
            "notes": "Customer for order tests.",
        },
    )

    assert response.status_code == 201

    return response.json()["id"]


def test_create_order():
    """An order can be created for an existing customer."""
    reset_database()
    customer_id = create_test_customer()

    response = client.post(
        "/api/v1/orders",
        json={
            "customer_id": customer_id,
            "total_amount": "1250.50",
            "currency": "USD",
            "description": "Initial business order",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["customer_id"] == customer_id
    assert data["total_amount"] == "1250.50"
    assert data["currency"] == "USD"
    assert data["status"] == "pending"
    assert data["order_number"].startswith("ORD-")


def test_create_order_requires_existing_customer():
    """An order cannot be created for a missing customer."""
    reset_database()

    response = client.post(
        "/api/v1/orders",
        json={
            "customer_id": 9999,
            "total_amount": "500.00",
            "currency": "USD",
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Customer not found."


def test_list_orders():
    """Orders can be listed and filtered."""
    reset_database()
    customer_id = create_test_customer()

    first_response = client.post(
        "/api/v1/orders",
        json={
            "customer_id": customer_id,
            "total_amount": "100.00",
            "currency": "USD",
            "description": "Website hosting",
        },
    )

    second_response = client.post(
        "/api/v1/orders",
        json={
            "customer_id": customer_id,
            "total_amount": "250.00",
            "currency": "USD",
            "description": "Infrastructure support",
        },
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 201

    response = client.get("/api/v1/orders")

    assert response.status_code == 200

    data = response.json()

    assert data["total"] == 2
    assert len(data["items"]) == 2


def test_search_orders():
    """Orders can be searched by order number or description."""
    reset_database()
    customer_id = create_test_customer()

    client.post(
        "/api/v1/orders",
        json={
            "customer_id": customer_id,
            "total_amount": "750.00",
            "currency": "USD",
            "description": "Cloud infrastructure deployment",
        },
    )

    response = client.get(
        "/api/v1/orders",
        params={"search": "infrastructure"},
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total"] == 1
    assert data["items"][0]["description"] == "Cloud infrastructure deployment"


def test_get_order():
    """An order can be retrieved by ID and order number."""
    reset_database()
    customer_id = create_test_customer()

    create_response = client.post(
        "/api/v1/orders",
        json={
            "customer_id": customer_id,
            "total_amount": "900.00",
            "currency": "USD",
            "description": "Operations subscription",
        },
    )

    order = create_response.json()

    response = client.get(
        f"/api/v1/orders/{order['id']}",
    )

    assert response.status_code == 200
    assert response.json()["order_number"] == order["order_number"]

    number_response = client.get(
        f"/api/v1/orders/number/{order['order_number']}",
    )

    assert number_response.status_code == 200
    assert number_response.json()["id"] == order["id"]


def test_update_order():
    """An order can be updated."""
    reset_database()
    customer_id = create_test_customer()

    create_response = client.post(
        "/api/v1/orders",
        json={
            "customer_id": customer_id,
            "total_amount": "1200.00",
            "currency": "USD",
            "description": "Original order",
        },
    )

    order_id = create_response.json()["id"]

    response = client.patch(
        f"/api/v1/orders/{order_id}",
        json={
            "status": "processing",
            "total_amount": "1350.75",
            "description": "Updated order",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "processing"
    assert data["total_amount"] == "1350.75"
    assert data["description"] == "Updated order"


def test_delete_order():
    """An order can be deleted."""
    reset_database()
    customer_id = create_test_customer()

    create_response = client.post(
        "/api/v1/orders",
        json={
            "customer_id": customer_id,
            "total_amount": "450.00",
            "currency": "USD",
        },
    )

    order_id = create_response.json()["id"]

    delete_response = client.delete(
        f"/api/v1/orders/{order_id}",
    )

    assert delete_response.status_code == 204

    get_response = client.get(
        f"/api/v1/orders/{order_id}",
    )

    assert get_response.status_code == 404


def test_filter_orders_by_status():
    """Orders can be filtered by lifecycle status."""
    reset_database()
    customer_id = create_test_customer()

    first_response = client.post(
        "/api/v1/orders",
        json={
            "customer_id": customer_id,
            "total_amount": "100.00",
            "currency": "USD",
        },
    )

    second_response = client.post(
        "/api/v1/orders",
        json={
            "customer_id": customer_id,
            "total_amount": "200.00",
            "currency": "USD",
        },
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 201

    second_order_id = second_response.json()["id"]

    update_response = client.patch(
        f"/api/v1/orders/{second_order_id}",
        json={"status": "completed"},
    )

    assert update_response.status_code == 200

    response = client.get(
        "/api/v1/orders",
        params={"status": "completed"},
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total"] == 1
    assert data["items"][0]["status"] == "completed"
    assert Decimal(data["items"][0]["total_amount"]) == Decimal("200.00")