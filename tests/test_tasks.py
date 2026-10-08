"""Tests for the Tasks API."""

from datetime import date, timedelta

from fastapi.testclient import TestClient

from business_operations.main import app

client = TestClient(app)


def test_create_task():
    response = client.post(
        "/api/v1/tasks",
        json={
            "title": "Review monthly operations report",
            "description": "Validate operational metrics before publication.",
            "priority": "high",
            "assignee": "Operations Team",
            "due_date": str(date.today() + timedelta(days=7)),
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Review monthly operations report"
    assert data["priority"] == "high"
    assert data["status"] == "todo"


def test_task_summary():
    response = client.get("/api/v1/tasks/summary")

    assert response.status_code == 200
    data = response.json()

    assert data["total"] == 0
    assert data["completed"] == 0


def test_update_task_status():
    created = client.post(
        "/api/v1/tasks",
        json={
            "title": "Complete onboarding workflow",
            "priority": "medium",
        },
    )

    assert created.status_code == 201
    task_id = created.json()["id"]

    response = client.patch(
        f"/api/v1/tasks/{task_id}",
        json={"status": "in_progress"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == "in_progress"


def test_filter_tasks_by_status():
    response = client.get("/api/v1/tasks?status=in_progress")

    assert response.status_code == 200
    data = response.json()

    assert data["items"] == []
    assert data["total"] == 0


def test_delete_task():
    created = client.post(
        "/api/v1/tasks",
        json={
            "title": "Temporary operational task",
            "priority": "low",
        },
    )

    assert created.status_code == 201
    task_id = created.json()["id"]

    response = client.delete(f"/api/v1/tasks/{task_id}")
    assert response.status_code == 204

    response = client.get(f"/api/v1/tasks/{task_id}")
    assert response.status_code == 404