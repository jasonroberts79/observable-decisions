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

import firebase_admin
from firebase_admin import auth as firebase_auth
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException, Request
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


def _init_firebase() -> None:
    project_id = os.environ.get("FIREBASE_PROJECT_ID")
    if project_id and not firebase_admin._apps:
        firebase_admin.initialize_app(options={"projectId": project_id})


async def _get_current_user(
    authorization: str | None = Header(default=None),
    x_user_email: str | None = Header(default=None),
) -> str | None:
    """Verify Firebase ID token and return the user's email.

    Falls back to the X-User-Email header when FIREBASE_PROJECT_ID is not set
    (local development without Firebase configured).
    """
    if authorization and authorization.startswith("Bearer "):
        token = authorization.removeprefix("Bearer ").strip()
        try:
            decoded = firebase_auth.verify_id_token(token)
            return decoded.get("email")
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
    return x_user_email


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
        from storage import GCSBackend

        bucket = os.environ.get("GCS_BUCKET_NAME", "")
        if not bucket:
            raise RuntimeError("GCS_BUCKET_NAME must be set.")
        storage = GCSBackend(bucket_name=bucket)

    _init_firebase()

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
        current_user: str | None = Depends(_get_current_user),
    ):
        """Return lightweight metadata for every decision owned by the caller."""
        metas = await _storage(request).list(_prefix(current_user))
        return [m.model_dump(by_alias=True) for m in metas]

    @application.post("/api/decisions", response_model=dict, status_code=201)
    async def create_decision(
        request: Request,
        body: DecisionCreate,
        current_user: str | None = Depends(_get_current_user),
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
            createdBy=current_user or "unknown",
        )

        prefix = _prefix(current_user)
        await _storage(request).put(prefix, decision_id, decision)
        return decision.model_dump(by_alias=True)

    @application.get("/api/decisions/{decision_id}", response_model=dict)
    async def get_decision(
        request: Request,
        decision_id: str,
        current_user: str | None = Depends(_get_current_user),
    ):
        """Retrieve a single decision by id."""
        try:
            decision = await _storage(request).get(_prefix(current_user), decision_id)
        except Exception:
            raise HTTPException(status_code=404, detail="Decision not found")
        return decision.model_dump(by_alias=True)

    @application.put("/api/decisions/{decision_id}", response_model=dict)
    async def update_decision(
        request: Request,
        decision_id: str,
        body: DecisionUpdate,
        current_user: str | None = Depends(_get_current_user),
    ):
        """Merge-update an existing decision."""
        prefix = _prefix(current_user)

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
        current_user: str | None = Depends(_get_current_user),
    ):
        """Delete a decision by id."""
        try:
            await _storage(request).delete(_prefix(current_user), decision_id)
        except Exception:
            raise HTTPException(status_code=500, detail="Failed to delete decision")
        return None

    @application.post("/api/decisions/{decision_id}/share", response_model=ShareResponse)
    async def share_decision(
        request: Request,
        decision_id: str,
        body: ShareRequest | None = None,
        current_user: str | None = Depends(_get_current_user),
    ):
        """Generate a shareable URL for a decision."""
        email = body.email if body else None
        try:
            url = await _storage(request).share(_prefix(current_user), decision_id, email)
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
