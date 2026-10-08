"""Customer API tests."""

from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete

from business_operations.db.session import Base, SessionLocal, engine, get_db
from business_operations.main import app
from business_operations.models.customer import Customer
from business_operations.models.order import Order

TEST_DATABASE_PATH = (
    Path(__file__).resolve().parent / "data" / "test_business_operations.db"
)


def override_get_db():
    """Provide a database session for tests."""
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    """Create database tables before running customer tests."""
    Base.metadata.create_all(bind=engine)
    yield


def clear_customers() -> None:
    """Remove orders and customers to isolate each test."""
    with SessionLocal() as db:
        db.execute(delete(Order))
        db.execute(delete(Customer))
        db.commit()


def test_create_customer() -> None:
    """A customer can be created."""
    clear_customers()

    response = client.post(
        "/api/v1/customers",
        json={
            "name": "Brian Wachira",
            "email": "brian@example.com",
            "phone": "+254700000000",
            "company": "OpsFlow",
            "status": "active",
            "notes": "Primary business contact",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["name"] == "Brian Wachira"
    assert data["email"] == "brian@example.com"
    assert data["status"] == "active"
    assert data["id"] > 0


def test_create_duplicate_customer_email() -> None:
    """Duplicate customer emails are rejected."""
    clear_customers()

    payload = {
        "name": "Brian Wachira",
        "email": "duplicate@example.com",
        "phone": "+254700000000",
        "company": "OpsFlow",
    }

    first_response = client.post(
        "/api/v1/customers",
        json=payload,
    )

    second_response = client.post(
        "/api/v1/customers",
        json=payload,
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 409
    assert (
        second_response.json()["detail"]
        == "A customer with this email already exists."
    )


def test_list_customers_with_search_and_status() -> None:
    """Customers can be filtered by search and status."""
    clear_customers()

    customers = [
        {
            "name": "Brian Wachira",
            "email": "brian@example.com",
            "company": "OpsFlow",
            "status": "active",
        },
        {
            "name": "Jane Kamau",
            "email": "jane@example.com",
            "company": "Acme Ltd",
            "status": "prospect",
        },
    ]

    for payload in customers:
        response = client.post(
            "/api/v1/customers",
            json=payload,
        )

        assert response.status_code == 201

    response = client.get(
        "/api/v1/customers",
        params={
            "search": "Brian",
            "status": "active",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total"] == 1
    assert len(data["items"]) == 1
    assert data["items"][0]["name"] == "Brian Wachira"


def test_get_customer() -> None:
    """A customer can be retrieved by ID."""
    clear_customers()

    create_response = client.post(
        "/api/v1/customers",
        json={
            "name": "Brian Wachira",
            "email": "get@example.com",
            "company": "OpsFlow",
        },
    )

    assert create_response.status_code == 201

    customer_id = create_response.json()["id"]

    response = client.get(
        f"/api/v1/customers/{customer_id}",
    )

    assert response.status_code == 200
    assert response.json()["id"] == customer_id
    assert response.json()["email"] == "get@example.com"


def test_get_missing_customer() -> None:
    """A missing customer returns 404."""
    clear_customers()

    response = client.get(
        "/api/v1/customers/999999",
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Customer not found."


def test_update_customer() -> None:
    """A customer can be updated."""
    clear_customers()

    create_response = client.post(
        "/api/v1/customers",
        json={
            "name": "Brian Wachira",
            "email": "update@example.com",
            "company": "OpsFlow",
        },
    )

    assert create_response.status_code == 201

    customer_id = create_response.json()["id"]

    update_response = client.patch(
        f"/api/v1/customers/{customer_id}",
        json={
            "name": "Brian Wachira Updated",
            "status": "inactive",
        },
    )

    assert update_response.status_code == 200

    data = update_response.json()

    assert data["name"] == "Brian Wachira Updated"
    assert data["status"] == "inactive"
    assert data["email"] == "update@example.com"


def test_delete_customer() -> None:
    """A customer without orders can be deleted."""
    clear_customers()

    create_response = client.post(
        "/api/v1/customers",
        json={
            "name": "Brian Wachira",
            "email": "delete@example.com",
            "phone": "+254700000000",
            "company": "OpsFlow",
        },
    )

    assert create_response.status_code == 201

    customer_id = create_response.json()["id"]

    delete_response = client.delete(
        f"/api/v1/customers/{customer_id}",
    )

    assert delete_response.status_code == 204

    get_response = client.get(
        f"/api/v1/customers/{customer_id}",
    )

    assert get_response.status_code == 404


def test_delete_customer_with_orders_is_rejected() -> None:
    """A customer with existing orders cannot be deleted."""
    clear_customers()

    customer_response = client.post(
        "/api/v1/customers",
        json={
            "name": "Order Customer",
            "email": "order-customer@example.com",
            "company": "OpsFlow",
        },
    )

    assert customer_response.status_code == 201

    customer_id = customer_response.json()["id"]

    order_response = client.post(
        "/api/v1/orders",
        json={
            "customer_id": customer_id,
            "total_amount": "1250.00",
            "currency": "USD",
            "description": "Customer retention order",
        },
    )

    assert order_response.status_code == 201

    delete_response = client.delete(
        f"/api/v1/customers/{customer_id}",
    )

    assert delete_response.status_code == 409
    assert (
        delete_response.json()["detail"]
        == (
            "Customer cannot be deleted because existing orders "
            "reference this customer."
        )
    )

    get_response = client.get(
        f"/api/v1/customers/{customer_id}",
    )

    assert get_response.status_code == 200