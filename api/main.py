"""
Observable Decisions – FastAPI Backend

Provides CRUD + share endpoints for decision records, backed by Azure Blob Storage.

Environment variables:
    AZURE_STORAGE_CONNECTION_STRING  – required
    AZURE_STORAGE_CONTAINER          – optional, defaults to "decisions"
    API_CORS_ORIGINS                 – optional, comma-separated allowed origins
"""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware

from models import (
    Decision,
    DecisionCreate,
    DecisionMeta,
    DecisionUpdate,
    ShareRequest,
    ShareResponse,
)
from storage.base import StorageBackend

load_dotenv()


# ---------------------------------------------------------------------------
# App factory
# ---------------------------------------------------------------------------


def create_app(storage: StorageBackend | None = None) -> FastAPI:
    """Build and return the FastAPI application.

    Parameters
    ----------
    storage:
        If *None* (the default – used in production), the backend is created
        from environment variables.  Pass a concrete backend in tests to avoid
        requiring real Azure credentials.
    """
    if storage is None:
        from storage import AzureBlobBackend

        conn = os.environ.get("AZURE_STORAGE_CONNECTION_STRING", "")
        container = os.environ.get("AZURE_STORAGE_CONTAINER", "decisions")
        if not conn:
            raise RuntimeError(
                "AZURE_STORAGE_CONNECTION_STRING must be set. "
                "See https://learn.microsoft.com/en-us/azure/storage/common/storage-configure-connection-string"
            )
        storage = AzureBlobBackend(connection_string=conn, container=container)

    application = FastAPI(
        title="Observable Decisions API",
        version="0.1.0",
        docs_url="/docs",
    )
    application.state.storage = storage

    origins = os.environ.get("API_CORS_ORIGINS", "http://localhost:3000").split(",")
    application.add_middleware(
        CORSMiddleware,
        allow_origins=[o.strip() for o in origins],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    _register_routes(application)
    return application


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _storage(request: Request) -> StorageBackend:
    return request.app.state.storage


def _prefix(user: str | None) -> str:
    """Per-user blob prefix, matching the TS convention."""
    return f"users/{user or 'default'}/"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


def _register_routes(application: FastAPI) -> None:
    @application.get("/api/decisions", response_model=list[DecisionMeta])
    async def list_decisions(
        request: Request,
        x_user_email: str | None = Header(default=None),
    ):
        """Return lightweight metadata for every decision owned by the caller."""
        metas = await _storage(request).list(_prefix(x_user_email))
        return [m.model_dump(by_alias=True) for m in metas]

    @application.post("/api/decisions", response_model=dict, status_code=201)
    async def create_decision(
        request: Request,
        body: DecisionCreate,
        x_user_email: str | None = Header(default=None),
    ):
        """Create a new decision record."""
        now = _now_iso()
        decision_id = uuid.uuid4().hex[:21]

        decision = Decision(
            id=decision_id,
            title=body.title,
            status=body.status,
            date=body.date,
            deciders=body.deciders,
            tags=body.tags,
            context=body.context,
            decision=body.decision,
            consequences=body.consequences,
            options=body.options,
            supersededBy=body.superseded_by,
            sharedWith=body.shared_with,
            createdAt=now,
            updatedAt=now,
            createdBy=x_user_email or "unknown",
        )

        prefix = _prefix(x_user_email)
        await _storage(request).put(prefix, decision_id, decision)
        return decision.model_dump(by_alias=True)

    @application.get("/api/decisions/{decision_id}", response_model=dict)
    async def get_decision(
        request: Request,
        decision_id: str,
        x_user_email: str | None = Header(default=None),
    ):
        """Retrieve a single decision by id."""
        try:
            decision = await _storage(request).get(_prefix(x_user_email), decision_id)
        except Exception:
            raise HTTPException(status_code=404, detail="Decision not found")
        return decision.model_dump(by_alias=True)

    @application.put("/api/decisions/{decision_id}", response_model=dict)
    async def update_decision(
        request: Request,
        decision_id: str,
        body: DecisionUpdate,
        x_user_email: str | None = Header(default=None),
    ):
        """Merge-update an existing decision."""
        prefix = _prefix(x_user_email)

        try:
            existing = await _storage(request).get(prefix, decision_id)
        except Exception:
            raise HTTPException(status_code=404, detail="Decision not found")

        updates = body.model_dump(by_alias=True, exclude_unset=True)
        merged = existing.model_dump(by_alias=True)
        merged.update(updates)
        merged["updatedAt"] = _now_iso()
        merged["id"] = decision_id

        updated = Decision.model_validate(merged)
        await _storage(request).put(prefix, decision_id, updated)
        return updated.model_dump(by_alias=True)

    @application.delete("/api/decisions/{decision_id}", status_code=204)
    async def delete_decision(
        request: Request,
        decision_id: str,
        x_user_email: str | None = Header(default=None),
    ):
        """Delete a decision by id."""
        try:
            await _storage(request).delete(_prefix(x_user_email), decision_id)
        except Exception:
            raise HTTPException(status_code=500, detail="Failed to delete decision")
        return None

    @application.post("/api/decisions/{decision_id}/share", response_model=ShareResponse)
    async def share_decision(
        request: Request,
        decision_id: str,
        body: ShareRequest | None = None,
        x_user_email: str | None = Header(default=None),
    ):
        """Generate a shareable URL for a decision."""
        email = body.email if body else None
        try:
            url = await _storage(request).share(_prefix(x_user_email), decision_id, email)
        except Exception:
            raise HTTPException(status_code=500, detail="Failed to generate share link")
        return ShareResponse(url=url)


# ---------------------------------------------------------------------------
# Default app instance (used by `uvicorn main:app`)
# ---------------------------------------------------------------------------


def _make_default_app() -> FastAPI:
    """Lazy-create so that importing this module in tests doesn't require env vars."""
    if os.environ.get("AZURE_STORAGE_CONNECTION_STRING"):
        return create_app()
    # Return a placeholder; production must have the env var set.
    return create_app.__wrapped__  # type: ignore[attr-defined]  # noqa: never reached


# When running under uvicorn, the env var will be set.
# When running under pytest, tests use create_app(storage=...) directly.
if os.environ.get("AZURE_STORAGE_CONNECTION_STRING"):
    app = create_app()
else:
    # Provide a module-level `app` so the import doesn't crash in test environments.
    # Production startup via uvicorn will fail loudly if the env var is missing
    # because create_app() raises RuntimeError.
    app: FastAPI = None  # type: ignore[assignment]
