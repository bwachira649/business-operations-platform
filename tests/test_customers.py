"""Tests for the customer API."""

from pathlib import Path

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from business_operations.db.session import Base, get_db
from business_operations.main import app

TEST_DATA_DIR = Path(__file__).resolve().parents[1] / "data"
TEST_DATA_DIR.mkdir(exist_ok=True)

TEST_DATABASE_URL = (
    f"sqlite:///{TEST_DATA_DIR / 'test_business_operations.db'}"
)

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestingSessionLocal = sessionmaker(
    bind=test_engine,
    autoflush=False,
    autocommit=False,
)

Base.metadata.create_all(bind=test_engine)


def override_get_db():
    """Provide a database session connected to the test database."""
    db = TestingSessionLocal()

    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


def clear_customers() -> None:
    """Remove all customers from the test database."""
    db = TestingSessionLocal()

    try:
        db.execute(text("DELETE FROM customers"))
        db.commit()
    finally:
        db.close()


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
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["name"] == "Brian Wachira"
    assert data["email"] == "brian@example.com"
    assert data["phone"] == "+254700000000"
    assert data["company"] == "OpsFlow"
    assert data["status"] == "active"


def test_duplicate_customer_email_is_rejected() -> None:
    """Duplicate customer email addresses are rejected."""
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


def test_list_customers_and_search() -> None:
    """Customers can be listed and searched."""
    clear_customers()

    customers = [
        {
            "name": "Brian Wachira",
            "email": "brian@example.com",
            "phone": "+254700000000",
            "company": "OpsFlow",
        },
        {
            "name": "Jane Mwangi",
            "email": "jane@example.com",
            "phone": "+254711111111",
            "company": "Acme Ltd",
        },
    ]

    for customer in customers:
        response = client.post(
            "/api/v1/customers",
            json=customer,
        )
        assert response.status_code == 201

    response = client.get("/api/v1/customers")

    assert response.status_code == 200

    data = response.json()

    assert data["total"] == 2
    assert len(data["items"]) == 2

    search_response = client.get(
        "/api/v1/customers",
        params={"search": "Brian"},
    )

    assert search_response.status_code == 200

    search_data = search_response.json()

    assert search_data["total"] == 1
    assert search_data["items"][0]["name"] == "Brian Wachira"


def test_get_customer() -> None:
    """A customer can be retrieved by ID."""
    clear_customers()

    create_response = client.post(
        "/api/v1/customers",
        json={
            "name": "Brian Wachira",
            "email": "get@example.com",
            "phone": "+254700000000",
            "company": "OpsFlow",
        },
    )

    assert create_response.status_code == 201

    customer_id = create_response.json()["id"]

    response = client.get(
        f"/api/v1/customers/{customer_id}",
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == customer_id
    assert data["name"] == "Brian Wachira"
    assert data["email"] == "get@example.com"


def test_update_customer() -> None:
    """A customer can be updated."""
    clear_customers()

    create_response = client.post(
        "/api/v1/customers",
        json={
            "name": "Brian Wachira",
            "email": "update@example.com",
            "phone": "+254700000000",
            "company": "OpsFlow",
        },
    )

    assert create_response.status_code == 201

    customer_id = create_response.json()["id"]

    response = client.patch(
        f"/api/v1/customers/{customer_id}",
        json={
            "company": "Updated Operations Ltd",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["name"] == "Brian Wachira"
    assert data["company"] == "Updated Operations Ltd"


def test_delete_customer() -> None:
    """A customer can be deleted."""
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