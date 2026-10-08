"""Shared pytest configuration."""

from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from business_operations.db.session import Base, get_db
from business_operations.main import app

BASE_DIR = Path(__file__).resolve().parents[1]
TEST_DATABASE = BASE_DIR / "data" / "test_business_operations.db"

TEST_DATABASE_URL = f"sqlite:///{TEST_DATABASE}"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestSessionLocal = sessionmaker(
    bind=test_engine,
    autoflush=False,
    autocommit=False,
)


def override_get_db():
    """Provide an isolated database session for tests."""
    db = TestSessionLocal()

    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def isolate_test_database():
    """Run every test against a clean isolated database."""
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)

    app.dependency_overrides[get_db] = override_get_db

    yield

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session() -> Session:
    """Provide a direct session to the isolated test database."""
    db = TestSessionLocal()

    try:
        yield db
    finally:
        db.close()