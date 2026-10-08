"""Tests for the Inventory API."""

from fastapi.testclient import TestClient

from business_operations.main import app

client = TestClient(app)


def inventory_payload(
    *,
    sku="SKU-001",
    name="Wireless Keyboard",
    category="Electronics",
    quantity=50,
    reorder_level=10,
    unit_price="45.99",
    status="active",
    description="Business wireless keyboard",
):
    return {
        "sku": sku,
        "name": name,
        "category": category,
        "quantity": quantity,
        "reorder_level": reorder_level,
        "unit_price": unit_price,
        "status": status,
        "description": description,
    }


def test_create_inventory_item():
    """An inventory item can be created."""
    response = client.post(
        "/api/v1/inventory",
        json=inventory_payload(),
    )

    assert response.status_code == 201

    data = response.json()

    assert data["sku"] == "SKU-001"
    assert data["name"] == "Wireless Keyboard"
    assert data["quantity"] == 50
    assert data["reorder_level"] == 10
    assert data["status"] == "active"


def test_duplicate_sku_is_rejected():
    """Duplicate SKUs are rejected."""
    payload = inventory_payload()

    first = client.post("/api/v1/inventory", json=payload)
    second = client.post("/api/v1/inventory", json=payload)

    assert first.status_code == 201
    assert second.status_code == 409
    assert "SKU already exists" in second.json()["detail"]


def test_list_search_and_filter_inventory():
    """Inventory supports search and low-stock filtering."""
    client.post(
        "/api/v1/inventory",
        json=inventory_payload(
            sku="LAP-001",
            name="Business Laptop",
            category="Computers",
            quantity=20,
        ),
    )

    client.post(
        "/api/v1/inventory",
        json=inventory_payload(
            sku="MON-001",
            name="Office Monitor",
            category="Displays",
            quantity=3,
            reorder_level=5,
        ),
    )

    search_response = client.get(
        "/api/v1/inventory",
        params={"search": "Laptop"},
    )

    assert search_response.status_code == 200
    assert search_response.json()["total"] == 1
    assert search_response.json()["items"][0]["sku"] == "LAP-001"

    low_stock_response = client.get(
        "/api/v1/inventory",
        params={"low_stock": "true"},
    )

    assert low_stock_response.status_code == 200
    assert low_stock_response.json()["total"] == 1
    assert low_stock_response.json()["items"][0]["sku"] == "MON-001"


def test_get_inventory_item():
    """An inventory item can be retrieved."""
    create_response = client.post(
        "/api/v1/inventory",
        json=inventory_payload(),
    )

    item_id = create_response.json()["id"]

    response = client.get(f"/api/v1/inventory/{item_id}")

    assert response.status_code == 200
    assert response.json()["id"] == item_id
    assert response.json()["sku"] == "SKU-001"


def test_get_missing_inventory_item():
    """Missing inventory items return 404."""
    response = client.get("/api/v1/inventory/9999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Inventory item not found."


def test_update_inventory_item():
    """An inventory item can be updated."""
    create_response = client.post(
        "/api/v1/inventory",
        json=inventory_payload(),
    )

    item_id = create_response.json()["id"]

    response = client.patch(
        f"/api/v1/inventory/{item_id}",
        json={
            "quantity": 8,
            "reorder_level": 10,
            "unit_price": "49.99",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["quantity"] == 8
    assert data["reorder_level"] == 10
    assert data["unit_price"] == "49.99"


def test_update_with_duplicate_sku_is_rejected():
    """An inventory update cannot reuse another item's SKU."""
    client.post(
        "/api/v1/inventory",
        json=inventory_payload(sku="SKU-001"),
    )

    second_response = client.post(
        "/api/v1/inventory",
        json=inventory_payload(
            sku="SKU-002",
            name="USB Hub",
        ),
    )

    second_id = second_response.json()["id"]

    response = client.patch(
        f"/api/v1/inventory/{second_id}",
        json={"sku": "SKU-001"},
    )

    assert response.status_code == 409
    assert "SKU already exists" in response.json()["detail"]


def test_inventory_summary():
    """Inventory summary reports correct operational metrics."""
    client.post(
        "/api/v1/inventory",
        json=inventory_payload(
            sku="SKU-001",
            quantity=50,
            status="active",
        ),
    )

    client.post(
        "/api/v1/inventory",
        json=inventory_payload(
            sku="SKU-002",
            quantity=5,
            reorder_level=10,
            status="active",
        ),
    )

    client.post(
        "/api/v1/inventory",
        json=inventory_payload(
            sku="SKU-003",
            quantity=100,
            status="inactive",
        ),
    )

    response = client.get("/api/v1/inventory/summary")

    assert response.status_code == 200

    data = response.json()

    assert data["total_items"] == 3
    assert data["active_items"] == 2
    assert data["low_stock_items"] == 1
    assert data["total_units"] == 155


def test_delete_inventory_item():
    """An inventory item can be deleted."""
    create_response = client.post(
        "/api/v1/inventory",
        json=inventory_payload(),
    )

    item_id = create_response.json()["id"]

    delete_response = client.delete(
        f"/api/v1/inventory/{item_id}",
    )

    assert delete_response.status_code == 204

    get_response = client.get(
        f"/api/v1/inventory/{item_id}",
    )

    assert get_response.status_code == 404