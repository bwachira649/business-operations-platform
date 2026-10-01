"""Application entry point for the Business Operations Platform."""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from business_operations.api.customers import router as customers_router
from business_operations.db.session import Base, engine

BASE_DIR = Path(__file__).resolve().parents[2]
WEB_DIR = BASE_DIR / "web"
STATIC_DIR = WEB_DIR / "static"
INDEX_FILE = WEB_DIR / "index.html"


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Initialize application resources during startup."""
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Business Operations Platform",
    description=(
        "A full-stack business operations platform for managing "
        "customers, products, orders, inventory, payments, "
        "notifications, reporting, and operational workflows."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.mount(
    "/static",
    StaticFiles(directory=STATIC_DIR),
    name="static",
)

app.include_router(customers_router)


@app.get("/", include_in_schema=False)
def dashboard() -> FileResponse:
    """Serve the OpsFlow dashboard."""
    return FileResponse(INDEX_FILE)


@app.get("/health", tags=["System"])
def health_check() -> dict[str, str]:
    """Return the application health status."""
    return {
        "status": "healthy",
        "service": "business-operations-platform",
        "version": "0.1.0",
    }


def main() -> None:
    """Run the application with Uvicorn."""
    import uvicorn

    uvicorn.run(
        "business_operations.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )


if __name__ == "__main__":
    main()