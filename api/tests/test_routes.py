"""Integration tests for FastAPI routes using the in-memory storage backend."""

from __future__ import annotations

import pytest
from httpx import AsyncClient

from tests.conftest import make_decision, MemoryBackend


# ---------------------------------------------------------------------------
# POST /api/decisions  (create)
# ---------------------------------------------------------------------------


class TestCreateDecision:
    @pytest.mark.asyncio
    async def test_create_minimal(self, client: AsyncClient):
        res = await client.post(
            "/api/decisions",
            json={"title": "Use Postgres", "date": "2026-03-21"},
            headers={"x-user-email": "alice@example.com"},
        )
        assert res.status_code == 201
        data = res.json()
        assert data["title"] == "Use Postgres"
        assert data["status"] == "proposed"
        assert data["createdBy"] == "alice@example.com"
        assert "id" in data
        assert "createdAt" in data
        assert "updatedAt" in data

    @pytest.mark.asyncio
    async def test_create_with_all_fields(self, client: AsyncClient):
        res = await client.post(
            "/api/decisions",
            json={
                "title": "Use Kafka",
                "date": "2026-03-21",
                "status": "accepted",
                "deciders": ["alice", "bob"],
                "tags": ["messaging"],
                "context": "Need async messaging",
                "decision": "Use Kafka",
                "consequences": "Ops overhead",
                "options": [
                    {"id": "o1", "title": "Kafka", "chosen": True},
                    {"id": "o2", "title": "RabbitMQ"},
                ],
            },
            headers={"x-user-email": "alice@example.com"},
        )
        assert res.status_code == 201
        data = res.json()
        assert data["status"] == "accepted"
        assert data["tags"] == ["messaging"]
        assert len(data["options"]) == 2
        assert data["options"][0]["chosen"] is True

    @pytest.mark.asyncio
    async def test_create_no_email_defaults_to_unknown(self, client: AsyncClient):
        res = await client.post(
            "/api/decisions",
            json={"title": "Test", "date": "2026-03-21"},
        )
        assert res.status_code == 201
        assert res.json()["createdBy"] == "unknown"

    @pytest.mark.asyncio
    async def test_create_empty_title_rejected(self, client: AsyncClient):
        res = await client.post(
            "/api/decisions",
            json={"title": "", "date": "2026-03-21"},
        )
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_create_missing_title_rejected(self, client: AsyncClient):
        res = await client.post(
            "/api/decisions",
            json={"date": "2026-03-21"},
        )
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_create_persists_to_storage(
        self, client: AsyncClient, memory_backend: MemoryBackend
    ):
        res = await client.post(
            "/api/decisions",
            json={"title": "Persisted", "date": "2026-03-21"},
            headers={"x-user-email": "bob@example.com"},
        )
        decision_id = res.json()["id"]
        stored = await memory_backend.get("users/bob@example.com/", decision_id)
        assert stored.title == "Persisted"


# ---------------------------------------------------------------------------
# GET /api/decisions  (list)
# ---------------------------------------------------------------------------


class TestListDecisions:
    @pytest.mark.asyncio
    async def test_list_empty(self, client: AsyncClient):
        res = await client.get(
            "/api/decisions",
            headers={"x-user-email": "alice@example.com"},
        )
        assert res.status_code == 200
        assert res.json() == []

    @pytest.mark.asyncio
    async def test_list_after_creates(self, client: AsyncClient):
        for title in ["First", "Second", "Third"]:
            await client.post(
                "/api/decisions",
                json={"title": title, "date": "2026-03-21"},
                headers={"x-user-email": "alice@example.com"},
            )

        res = await client.get(
            "/api/decisions",
            headers={"x-user-email": "alice@example.com"},
        )
        assert res.status_code == 200
        titles = [d["title"] for d in res.json()]
        assert set(titles) == {"First", "Second", "Third"}

    @pytest.mark.asyncio
    async def test_list_returns_only_meta_fields(self, client: AsyncClient):
        await client.post(
            "/api/decisions",
            json={
                "title": "Meta Test",
                "date": "2026-03-21",
                "context": "Should not be in meta",
            },
            headers={"x-user-email": "alice@example.com"},
        )

        res = await client.get(
            "/api/decisions",
            headers={"x-user-email": "alice@example.com"},
        )
        item = res.json()[0]
        assert "title" in item
        assert "id" in item
        assert "context" not in item
        assert "consequences" not in item

    @pytest.mark.asyncio
    async def test_list_user_isolation(self, client: AsyncClient):
        """Decisions from user A are not visible to user B."""
        await client.post(
            "/api/decisions",
            json={"title": "Alice's", "date": "2026-03-21"},
            headers={"x-user-email": "alice@example.com"},
        )
        await client.post(
            "/api/decisions",
            json={"title": "Bob's", "date": "2026-03-21"},
            headers={"x-user-email": "bob@example.com"},
        )

        alice_res = await client.get(
            "/api/decisions",
            headers={"x-user-email": "alice@example.com"},
        )
        bob_res = await client.get(
            "/api/decisions",
            headers={"x-user-email": "bob@example.com"},
        )

        alice_titles = [d["title"] for d in alice_res.json()]
        bob_titles = [d["title"] for d in bob_res.json()]
        assert alice_titles == ["Alice's"]
        assert bob_titles == ["Bob's"]


# ---------------------------------------------------------------------------
# GET /api/decisions/{id}  (get)
# ---------------------------------------------------------------------------


class TestGetDecision:
    @pytest.mark.asyncio
    async def test_get_existing(self, client: AsyncClient):
        create_res = await client.post(
            "/api/decisions",
            json={"title": "Get Me", "date": "2026-03-21"},
            headers={"x-user-email": "alice@example.com"},
        )
        decision_id = create_res.json()["id"]

        res = await client.get(
            f"/api/decisions/{decision_id}",
            headers={"x-user-email": "alice@example.com"},
        )
        assert res.status_code == 200
        assert res.json()["title"] == "Get Me"
        assert res.json()["id"] == decision_id

    @pytest.mark.asyncio
    async def test_get_returns_full_decision(self, client: AsyncClient):
        create_res = await client.post(
            "/api/decisions",
            json={
                "title": "Full",
                "date": "2026-03-21",
                "context": "Some context",
                "decision": "Some decision",
                "consequences": "Some consequences",
            },
            headers={"x-user-email": "alice@example.com"},
        )
        decision_id = create_res.json()["id"]

        res = await client.get(
            f"/api/decisions/{decision_id}",
            headers={"x-user-email": "alice@example.com"},
        )
        data = res.json()
        assert data["context"] == "Some context"
        assert data["decision"] == "Some decision"
        assert data["consequences"] == "Some consequences"

    @pytest.mark.asyncio
    async def test_get_not_found(self, client: AsyncClient):
        res = await client.get(
            "/api/decisions/nonexistent",
            headers={"x-user-email": "alice@example.com"},
        )
        assert res.status_code == 404

    @pytest.mark.asyncio
    async def test_get_wrong_user(self, client: AsyncClient):
        """User B cannot get user A's decision."""
        create_res = await client.post(
            "/api/decisions",
            json={"title": "Private", "date": "2026-03-21"},
            headers={"x-user-email": "alice@example.com"},
        )
        decision_id = create_res.json()["id"]

        res = await client.get(
            f"/api/decisions/{decision_id}",
            headers={"x-user-email": "bob@example.com"},
        )
        assert res.status_code == 404


# ---------------------------------------------------------------------------
# PUT /api/decisions/{id}  (update)
# ---------------------------------------------------------------------------


class TestUpdateDecision:
    @pytest.mark.asyncio
    async def test_update_title(self, client: AsyncClient):
        create_res = await client.post(
            "/api/decisions",
            json={"title": "Old Title", "date": "2026-03-21"},
            headers={"x-user-email": "alice@example.com"},
        )
        decision_id = create_res.json()["id"]

        res = await client.put(
            f"/api/decisions/{decision_id}",
            json={"title": "New Title"},
            headers={"x-user-email": "alice@example.com"},
        )
        assert res.status_code == 200
        assert res.json()["title"] == "New Title"

    @pytest.mark.asyncio
    async def test_update_preserves_unchanged_fields(self, client: AsyncClient):
        create_res = await client.post(
            "/api/decisions",
            json={
                "title": "Original",
                "date": "2026-03-21",
                "tags": ["infra"],
                "context": "Original context",
            },
            headers={"x-user-email": "alice@example.com"},
        )
        decision_id = create_res.json()["id"]

        res = await client.put(
            f"/api/decisions/{decision_id}",
            json={"status": "accepted"},
            headers={"x-user-email": "alice@example.com"},
        )
        data = res.json()
        assert data["status"] == "accepted"
        assert data["title"] == "Original"
        assert data["tags"] == ["infra"]
        assert data["context"] == "Original context"

    @pytest.mark.asyncio
    async def test_update_bumps_timestamp(self, client: AsyncClient):
        create_res = await client.post(
            "/api/decisions",
            json={"title": "T", "date": "2026-03-21"},
            headers={"x-user-email": "alice@example.com"},
        )
        decision_id = create_res.json()["id"]
        original_updated = create_res.json()["updatedAt"]

        res = await client.put(
            f"/api/decisions/{decision_id}",
            json={"title": "T2"},
            headers={"x-user-email": "alice@example.com"},
        )
        assert res.json()["updatedAt"] >= original_updated

    @pytest.mark.asyncio
    async def test_update_preserves_id(self, client: AsyncClient):
        create_res = await client.post(
            "/api/decisions",
            json={"title": "T", "date": "2026-03-21"},
            headers={"x-user-email": "alice@example.com"},
        )
        decision_id = create_res.json()["id"]

        res = await client.put(
            f"/api/decisions/{decision_id}",
            json={"title": "Changed"},
            headers={"x-user-email": "alice@example.com"},
        )
        assert res.json()["id"] == decision_id

    @pytest.mark.asyncio
    async def test_update_not_found(self, client: AsyncClient):
        res = await client.put(
            "/api/decisions/nonexistent",
            json={"title": "X"},
            headers={"x-user-email": "alice@example.com"},
        )
        assert res.status_code == 404

    @pytest.mark.asyncio
    async def test_update_empty_title_rejected(self, client: AsyncClient):
        create_res = await client.post(
            "/api/decisions",
            json={"title": "T", "date": "2026-03-21"},
            headers={"x-user-email": "alice@example.com"},
        )
        decision_id = create_res.json()["id"]

        res = await client.put(
            f"/api/decisions/{decision_id}",
            json={"title": ""},
            headers={"x-user-email": "alice@example.com"},
        )
        assert res.status_code == 422


# ---------------------------------------------------------------------------
# DELETE /api/decisions/{id}
# ---------------------------------------------------------------------------


class TestDeleteDecision:
    @pytest.mark.asyncio
    async def test_delete_existing(self, client: AsyncClient):
        create_res = await client.post(
            "/api/decisions",
            json={"title": "To Delete", "date": "2026-03-21"},
            headers={"x-user-email": "alice@example.com"},
        )
        decision_id = create_res.json()["id"]

        res = await client.delete(
            f"/api/decisions/{decision_id}",
            headers={"x-user-email": "alice@example.com"},
        )
        assert res.status_code == 204

        # Confirm it's gone
        get_res = await client.get(
            f"/api/decisions/{decision_id}",
            headers={"x-user-email": "alice@example.com"},
        )
        assert get_res.status_code == 404

    @pytest.mark.asyncio
    async def test_delete_not_found(self, client: AsyncClient):
        res = await client.delete(
            "/api/decisions/nonexistent",
            headers={"x-user-email": "alice@example.com"},
        )
        assert res.status_code == 500

    @pytest.mark.asyncio
    async def test_delete_removes_from_list(self, client: AsyncClient):
        create_res = await client.post(
            "/api/decisions",
            json={"title": "Will Vanish", "date": "2026-03-21"},
            headers={"x-user-email": "alice@example.com"},
        )
        decision_id = create_res.json()["id"]

        await client.delete(
            f"/api/decisions/{decision_id}",
            headers={"x-user-email": "alice@example.com"},
        )

        list_res = await client.get(
            "/api/decisions",
            headers={"x-user-email": "alice@example.com"},
        )
        ids = [d["id"] for d in list_res.json()]
        assert decision_id not in ids


# ---------------------------------------------------------------------------
# POST /api/decisions/{id}/share
# ---------------------------------------------------------------------------


class TestShareDecision:
    @pytest.mark.asyncio
    async def test_share_returns_url(self, client: AsyncClient):
        create_res = await client.post(
            "/api/decisions",
            json={"title": "Shareable", "date": "2026-03-21"},
            headers={"x-user-email": "alice@example.com"},
        )
        decision_id = create_res.json()["id"]

        res = await client.post(
            f"/api/decisions/{decision_id}/share",
            json={},
            headers={"x-user-email": "alice@example.com"},
        )
        assert res.status_code == 200
        data = res.json()
        assert "url" in data
        assert decision_id in data["url"]

    @pytest.mark.asyncio
    async def test_share_with_email(self, client: AsyncClient):
        create_res = await client.post(
            "/api/decisions",
            json={"title": "Share Email", "date": "2026-03-21"},
            headers={"x-user-email": "alice@example.com"},
        )
        decision_id = create_res.json()["id"]

        res = await client.post(
            f"/api/decisions/{decision_id}/share",
            json={"email": "bob@example.com"},
            headers={"x-user-email": "alice@example.com"},
        )
        assert res.status_code == 200
        assert "url" in res.json()

    @pytest.mark.asyncio
    async def test_share_not_found(self, client: AsyncClient):
        res = await client.post(
            "/api/decisions/nonexistent/share",
            json={},
            headers={"x-user-email": "alice@example.com"},
        )
        assert res.status_code == 500


# ---------------------------------------------------------------------------
# Prefix / user isolation
# ---------------------------------------------------------------------------


class TestUserPrefix:
    @pytest.mark.asyncio
    async def test_default_user_prefix(self, client: AsyncClient):
        """No email header → uses 'default' prefix."""
        res = await client.post(
            "/api/decisions",
            json={"title": "No User", "date": "2026-03-21"},
        )
        assert res.status_code == 201

        list_res = await client.get("/api/decisions")
        assert len(list_res.json()) == 1

    @pytest.mark.asyncio
    async def test_full_crud_cycle(self, client: AsyncClient):
        """End-to-end: create → list → get → update → delete."""
        email = "integration@example.com"
        headers = {"x-user-email": email}

        # Create
        create_res = await client.post(
            "/api/decisions",
            json={"title": "E2E", "date": "2026-03-21", "tags": ["test"]},
            headers=headers,
        )
        assert create_res.status_code == 201
        did = create_res.json()["id"]

        # List
        list_res = await client.get("/api/decisions", headers=headers)
        assert any(d["id"] == did for d in list_res.json())

        # Get
        get_res = await client.get(f"/api/decisions/{did}", headers=headers)
        assert get_res.json()["title"] == "E2E"

        # Update
        put_res = await client.put(
            f"/api/decisions/{did}",
            json={"title": "E2E Updated", "status": "accepted"},
            headers=headers,
        )
        assert put_res.json()["title"] == "E2E Updated"
        assert put_res.json()["status"] == "accepted"
        assert put_res.json()["tags"] == ["test"]  # preserved

        # Share
        share_res = await client.post(
            f"/api/decisions/{did}/share", json={}, headers=headers
        )
        assert "url" in share_res.json()

        # Delete
        del_res = await client.delete(f"/api/decisions/{did}", headers=headers)
        assert del_res.status_code == 204

        # Confirm gone
        gone_res = await client.get(f"/api/decisions/{did}", headers=headers)
        assert gone_res.status_code == 404
