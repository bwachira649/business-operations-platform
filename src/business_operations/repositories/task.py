"""Task repository operations."""

from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from business_operations.models.task import Task


def list_tasks(
    db: Session,
    *,
    limit: int = 50,
    offset: int = 0,
    status: str | None = None,
    priority: str | None = None,
    search: str | None = None,
) -> tuple[list[Task], int]:
    """Return filtered tasks and total count."""

    query = select(Task)

    if status:
        query = query.where(Task.status == status)

    if priority:
        query = query.where(Task.priority == priority)

    if search:
        query = query.where(Task.title.ilike(f"%{search}%"))

    total = db.scalar(
        select(func.count()).select_from(query.subquery())
    ) or 0

    tasks = list(
        db.scalars(
            query.order_by(Task.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
    )

    return tasks, total


def get_task(db: Session, task_id: int) -> Task | None:
    """Return a task by ID."""

    return db.get(Task, task_id)


def create_task(db: Session, task: Task) -> Task:
    """Create and persist a task."""

    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def update_task(db: Session, task: Task) -> Task:
    """Persist changes to a task."""

    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def delete_task(db: Session, task: Task) -> None:
    """Delete a task."""

    db.delete(task)
    db.commit()


def get_task_summary(db: Session) -> dict[str, int]:
    """Return operational task counts."""

    total = db.scalar(select(func.count(Task.id))) or 0
    todo = db.scalar(
        select(func.count(Task.id)).where(Task.status == "todo")
    ) or 0
    in_progress = db.scalar(
        select(func.count(Task.id)).where(Task.status == "in_progress")
    ) or 0
    blocked = db.scalar(
        select(func.count(Task.id)).where(Task.status == "blocked")
    ) or 0
    completed = db.scalar(
        select(func.count(Task.id)).where(Task.status == "completed")
    ) or 0
    urgent = db.scalar(
        select(func.count(Task.id)).where(Task.priority == "urgent")
    ) or 0
    overdue = db.scalar(
        select(func.count(Task.id)).where(
            Task.due_date < date.today(),
            Task.status != "completed",
        )
    ) or 0

    return {
        "total": total,
        "todo": todo,
        "in_progress": in_progress,
        "blocked": blocked,
        "completed": completed,
        "urgent": urgent,
        "overdue": overdue,
    }
