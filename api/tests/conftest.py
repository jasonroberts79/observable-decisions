"""Shared fixtures for the Observable Decisions API test suite."""

from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from typing import AsyncGenerator

from models import Decision, DecisionMeta, to_meta
from storage.base import StorageBackend
from main import create_app


# ---------------------------------------------------------------------------
# In-memory storage backend (replaces Azure Blob in tests)
# ---------------------------------------------------------------------------


class MemoryBackend(StorageBackend):
    """Simple dict-backed storage for testing – no network calls needed."""

    def __init__(self) -> None:
        self._store: dict[str, Decision] = {}

    async def list(self, prefix: str) -> list[DecisionMeta]:
        metas = [
            to_meta(d)
            for key, d in self._store.items()
            if key.startswith(prefix)
        ]
        metas.sort(key=lambda m: m.updated_at, reverse=True)
        return metas

    async def get(self, prefix: str, decision_id: str) -> Decision:
        key = f"{prefix}{decision_id}"
        if key not in self._store:
            raise KeyError(f"Not found: {key}")
        return self._store[key]

    async def put(self, prefix: str, decision_id: str, data: Decision) -> None:
        self._store[f"{prefix}{decision_id}"] = data

    async def delete(self, prefix: str, decision_id: str) -> None:
        key = f"{prefix}{decision_id}"
        if key not in self._store:
            raise KeyError(f"Not found: {key}")
        del self._store[key]

    async def share(self, prefix: str, decision_id: str, email: str | None = None) -> str:
        key = f"{prefix}{decision_id}"
        if key not in self._store:
            raise KeyError(f"Not found: {key}")
        return f"https://blob.example.com/{key}?sas=fake"


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
def memory_backend() -> MemoryBackend:
    return MemoryBackend()


@pytest.fixture()
def app(memory_backend: MemoryBackend):
    return create_app(storage=memory_backend)


@pytest_asyncio.fixture()
async def client(app) -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


def make_decision(**overrides) -> Decision:
    """Helper to build a Decision with sensible defaults."""
    defaults = dict(
        id="test-abc-123",
        title="Use Postgres",
        status="accepted",
        date="2026-03-21",
        deciders=["alice"],
        tags=["database"],
        context="We need a relational store.",
        decision="Use Postgres.",
        consequences="Must manage schema migrations.",
        options=[],
        createdAt="2026-03-21T00:00:00+00:00",
        updatedAt="2026-03-21T00:00:00+00:00",
        createdBy="alice@example.com",
    )
    defaults.update(overrides)
    return Decision.model_validate(defaults)
