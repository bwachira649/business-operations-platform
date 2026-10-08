"""Task API routes."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from business_operations.db.session import get_db
from business_operations.models.task import Task
from business_operations.repositories.task import (
    create_task,
    delete_task,
    get_task,
    get_task_summary,
    list_tasks,
    update_task,
)
from business_operations.schemas.task import TaskCreate, TaskList, TaskRead, TaskUpdate

router = APIRouter(
    prefix="/api/v1/tasks",
    tags=["Tasks"],
)


@router.get("", response_model=TaskList)
def get_tasks(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    status_filter: str | None = Query(default=None, alias="status"),
    priority: str | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),  # noqa: B008
) -> TaskList:
    """List operational tasks."""

    tasks, total = list_tasks(
        db,
        limit=limit,
        offset=offset,
        status=status_filter,
        priority=priority,
        search=search,
    )

    return TaskList(
        items=tasks,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/summary")
def get_summary(
    db: Session = Depends(get_db),  # noqa: B008
) -> dict[str, int]:
    """Return task dashboard metrics."""

    return get_task_summary(db)


@router.get("/{task_id}", response_model=TaskRead)
def get_task_by_id(
    task_id: int,
    db: Session = Depends(get_db),  # noqa: B008
) -> Task:
    """Return a task by ID."""

    task = get_task(db, task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    return task


@router.post(
    "",
    response_model=TaskRead,
    status_code=status.HTTP_201_CREATED,
)
def create_task_item(
    payload: TaskCreate,
    db: Session = Depends(get_db),  # noqa: B008
) -> Task:
    """Create an operational task."""

    task = Task(**payload.model_dump())
    return create_task(db, task)


@router.patch("/{task_id}", response_model=TaskRead)
def update_task_item(
    task_id: int,
    payload: TaskUpdate,
    db: Session = Depends(get_db),  # noqa: B008
) -> Task:
    """Update an operational task."""

    task = get_task(db, task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)

    return update_task(db, task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task_item(
    task_id: int,
    db: Session = Depends(get_db),  # noqa: B008
) -> None:
    """Delete an operational task."""

    task = get_task(db, task_id)

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    delete_task(db, task)

