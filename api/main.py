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
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware

from models import (
    Decision,
    DecisionCreate,
    DecisionMeta,
    DecisionUpdate,
    ShareRequest,
    ShareResponse,
)
from storage import AzureBlobBackend

load_dotenv()

# ---------------------------------------------------------------------------
# Storage
# ---------------------------------------------------------------------------

_connection_string = os.environ.get("AZURE_STORAGE_CONNECTION_STRING", "")
_container = os.environ.get("AZURE_STORAGE_CONTAINER", "decisions")

if not _connection_string:
    raise RuntimeError(
        "AZURE_STORAGE_CONNECTION_STRING must be set. "
        "See https://learn.microsoft.com/en-us/azure/storage/common/storage-configure-connection-string"
    )

storage = AzureBlobBackend(connection_string=_connection_string, container=_container)

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Observable Decisions API",
    version="0.1.0",
    docs_url="/docs",
)

_cors_origins = os.environ.get("API_CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in _cors_origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _prefix(user: str | None) -> str:
    """Per-user blob prefix, matching the TS convention."""
    return f"users/{user or 'default'}/"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/api/decisions", response_model=list[DecisionMeta])
async def list_decisions(x_user_email: str | None = Header(default=None)):
    """Return lightweight metadata for every decision owned by the caller."""
    metas = await storage.list(_prefix(x_user_email))
    return [m.model_dump(by_alias=True) for m in metas]


@app.post("/api/decisions", response_model=dict, status_code=201)
async def create_decision(
    body: DecisionCreate,
    x_user_email: str | None = Header(default=None),
):
    """Create a new decision record. Returns the full decision with generated id & timestamps."""
    now = _now_iso()
    decision_id = uuid.uuid4().hex[:21]  # roughly same length as nanoid()

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
    await storage.put(prefix, decision_id, decision)
    return decision.model_dump(by_alias=True)


@app.get("/api/decisions/{decision_id}", response_model=dict)
async def get_decision(
    decision_id: str,
    x_user_email: str | None = Header(default=None),
):
    """Retrieve a single decision by id."""
    try:
        decision = await storage.get(_prefix(x_user_email), decision_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Decision not found")
    return decision.model_dump(by_alias=True)


@app.put("/api/decisions/{decision_id}", response_model=dict)
async def update_decision(
    decision_id: str,
    body: DecisionUpdate,
    x_user_email: str | None = Header(default=None),
):
    """Merge-update an existing decision. Only supplied fields are changed."""
    prefix = _prefix(x_user_email)

    try:
        existing = await storage.get(prefix, decision_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Decision not found")

    # Merge only the fields that were actually sent
    updates = body.model_dump(by_alias=True, exclude_unset=True)
    merged = existing.model_dump(by_alias=True)
    merged.update(updates)
    merged["updatedAt"] = _now_iso()
    merged["id"] = decision_id  # keep original id

    updated = Decision.model_validate(merged)
    await storage.put(prefix, decision_id, updated)
    return updated.model_dump(by_alias=True)


@app.delete("/api/decisions/{decision_id}", status_code=204)
async def delete_decision(
    decision_id: str,
    x_user_email: str | None = Header(default=None),
):
    """Delete a decision by id."""
    try:
        await storage.delete(_prefix(x_user_email), decision_id)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to delete decision")
    return None


@app.post("/api/decisions/{decision_id}/share", response_model=ShareResponse)
async def share_decision(
    decision_id: str,
    body: ShareRequest | None = None,
    x_user_email: str | None = Header(default=None),
):
    """Generate a shareable URL for a decision."""
    email = body.email if body else None
    try:
        url = await storage.share(_prefix(x_user_email), decision_id, email)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to generate share link")
    return ShareResponse(url=url)
