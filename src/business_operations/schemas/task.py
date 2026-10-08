"""Task API schemas."""

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class TaskBase(BaseModel):
    """Shared task fields."""

    title: str = Field(
        min_length=1,
        max_length=200,
    )

    description: str | None = Field(
        default=None,
        max_length=5000,
    )

    priority: str = Field(
        default="medium",
        pattern="^(low|medium|high|urgent)$",
    )

    assignee: str | None = Field(
        default=None,
        max_length=120,
    )

    due_date: date | None = None


class TaskCreate(TaskBase):
    """Fields required to create a task."""


class TaskUpdate(BaseModel):
    """Fields that may be updated on a task."""

    title: str | None = Field(
        default=None,
        min_length=1,
        max_length=200,
    )

    description: str | None = Field(
        default=None,
        max_length=5000,
    )

    status: str | None = Field(
        default=None,
        pattern="^(todo|in_progress|blocked|completed)$",
    )

    priority: str | None = Field(
        default=None,
        pattern="^(low|medium|high|urgent)$",
    )

    assignee: str | None = Field(
        default=None,
        max_length=120,
    )

    due_date: date | None = None


class TaskRead(TaskBase):
    """Task returned by the API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    created_at: datetime
    updated_at: datetime


class TaskList(BaseModel):
    """Paginated task response."""

    items: list[TaskRead]
    total: int
    limit: int
    offset: int
