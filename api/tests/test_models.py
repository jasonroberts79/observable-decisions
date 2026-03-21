"""Unit tests for Pydantic models and helpers."""

from __future__ import annotations

import json

import pytest
from pydantic import ValidationError

from models import (
    Decision,
    DecisionCreate,
    DecisionMeta,
    DecisionStatus,
    DecisionUpdate,
    Option,
    ShareRequest,
    ShareResponse,
    to_meta,
)


# ---------------------------------------------------------------------------
# DecisionStatus
# ---------------------------------------------------------------------------


class TestDecisionStatus:
    def test_all_values(self):
        assert set(DecisionStatus) == {
            DecisionStatus.proposed,
            DecisionStatus.accepted,
            DecisionStatus.rejected,
            DecisionStatus.deprecated,
            DecisionStatus.superseded,
        }

    def test_string_values(self):
        for member in DecisionStatus:
            assert member.value == member.name


# ---------------------------------------------------------------------------
# Option
# ---------------------------------------------------------------------------


class TestOption:
    def test_minimal(self):
        opt = Option(id="o1", title="A")
        assert opt.description == ""
        assert opt.pros == []
        assert opt.cons == []
        assert opt.chosen is False

    def test_full(self):
        opt = Option(
            id="o1",
            title="Redis",
            description="In-memory cache",
            pros=["Fast"],
            cons=["Volatile"],
            chosen=True,
        )
        assert opt.chosen is True
        assert opt.pros == ["Fast"]

    def test_empty_title_rejected(self):
        with pytest.raises(ValidationError):
            Option(id="o1", title="")


# ---------------------------------------------------------------------------
# Decision
# ---------------------------------------------------------------------------


class TestDecision:
    def test_minimal(self):
        d = Decision(
            id="d1",
            title="Use S3",
            date="2026-01-01",
            createdAt="2026-01-01T00:00:00Z",
            updatedAt="2026-01-01T00:00:00Z",
            createdBy="bob",
        )
        assert d.status == DecisionStatus.proposed
        assert d.deciders == []
        assert d.tags == []
        assert d.options == []
        assert d.superseded_by is None
        assert d.share_token is None
        assert d.shared_with == []

    def test_alias_serialization(self):
        d = Decision(
            id="d1",
            title="Use S3",
            date="2026-01-01",
            createdAt="2026-01-01T00:00:00Z",
            updatedAt="2026-01-01T00:00:00Z",
            createdBy="bob",
        )
        dumped = d.model_dump(by_alias=True)
        assert "createdAt" in dumped
        assert "updatedAt" in dumped
        assert "createdBy" in dumped
        assert "supersededBy" in dumped
        assert "shareToken" in dumped
        assert "sharedWith" in dumped
        # Python-name keys should NOT appear when using aliases
        assert "created_at" not in dumped
        assert "updated_at" not in dumped

    def test_populate_by_name(self):
        """Can construct using Python field names directly."""
        d = Decision(
            id="d1",
            title="Test",
            date="2026-01-01",
            created_at="2026-01-01T00:00:00Z",
            updated_at="2026-01-01T00:00:00Z",
            created_by="bob",
        )
        assert d.created_at == "2026-01-01T00:00:00Z"

    def test_empty_title_rejected(self):
        with pytest.raises(ValidationError):
            Decision(
                id="d1",
                title="",
                date="2026-01-01",
                createdAt="2026-01-01T00:00:00Z",
                updatedAt="2026-01-01T00:00:00Z",
                createdBy="bob",
            )

    def test_json_roundtrip(self):
        d = Decision(
            id="d1",
            title="Use S3",
            date="2026-01-01",
            tags=["infra", "storage"],
            createdAt="2026-01-01T00:00:00Z",
            updatedAt="2026-01-01T12:00:00Z",
            createdBy="bob",
        )
        payload = json.dumps(d.model_dump(by_alias=True))
        restored = Decision.model_validate_json(payload)
        assert restored.id == d.id
        assert restored.tags == d.tags

    def test_with_options(self):
        d = Decision(
            id="d1",
            title="Choose DB",
            date="2026-01-01",
            options=[
                Option(id="o1", title="Postgres", chosen=True),
                Option(id="o2", title="MySQL"),
            ],
            createdAt="2026-01-01T00:00:00Z",
            updatedAt="2026-01-01T00:00:00Z",
            createdBy="bob",
        )
        assert len(d.options) == 2
        assert d.options[0].chosen is True
        assert d.options[1].chosen is False

    def test_all_statuses_accepted(self):
        for status in DecisionStatus:
            d = Decision(
                id="d1",
                title="T",
                date="2026-01-01",
                status=status,
                createdAt="2026-01-01T00:00:00Z",
                updatedAt="2026-01-01T00:00:00Z",
                createdBy="bob",
            )
            assert d.status == status


# ---------------------------------------------------------------------------
# DecisionMeta & to_meta
# ---------------------------------------------------------------------------


class TestDecisionMeta:
    def test_to_meta_extracts_correct_fields(self):
        d = Decision(
            id="d1",
            title="Use Kafka",
            status=DecisionStatus.accepted,
            date="2026-02-15",
            tags=["messaging"],
            deciders=["alice", "bob"],
            context="Need async messaging.",
            decision="Use Kafka.",
            consequences="Ops overhead.",
            createdAt="2026-02-15T00:00:00Z",
            updatedAt="2026-02-15T12:00:00Z",
            createdBy="alice",
        )
        meta = to_meta(d)
        assert meta.id == "d1"
        assert meta.title == "Use Kafka"
        assert meta.status == DecisionStatus.accepted
        assert meta.date == "2026-02-15"
        assert meta.tags == ["messaging"]
        assert meta.deciders == ["alice", "bob"]
        assert meta.updated_at == "2026-02-15T12:00:00Z"
        assert meta.created_by == "alice"

    def test_meta_alias_serialization(self):
        meta = DecisionMeta(
            id="m1",
            title="T",
            status=DecisionStatus.proposed,
            date="2026-01-01",
            updatedAt="2026-01-01T00:00:00Z",
            createdBy="x",
        )
        dumped = meta.model_dump(by_alias=True)
        assert "updatedAt" in dumped
        assert "createdBy" in dumped

    def test_meta_does_not_contain_body_fields(self):
        d = Decision(
            id="d1",
            title="T",
            date="2026-01-01",
            context="Should not appear",
            decision="Should not appear",
            consequences="Should not appear",
            createdAt="2026-01-01T00:00:00Z",
            updatedAt="2026-01-01T00:00:00Z",
            createdBy="bob",
        )
        meta_dict = to_meta(d).model_dump(by_alias=True)
        assert "context" not in meta_dict
        assert "decision" not in meta_dict
        assert "consequences" not in meta_dict
        assert "options" not in meta_dict


# ---------------------------------------------------------------------------
# DecisionCreate
# ---------------------------------------------------------------------------


class TestDecisionCreate:
    def test_defaults(self):
        body = DecisionCreate(title="New", date="2026-03-21")
        assert body.status == DecisionStatus.proposed
        assert body.deciders == []
        assert body.tags == []

    def test_empty_title_rejected(self):
        with pytest.raises(ValidationError):
            DecisionCreate(title="", date="2026-03-21")

    def test_with_all_fields(self):
        body = DecisionCreate(
            title="Full",
            status=DecisionStatus.accepted,
            date="2026-03-21",
            deciders=["alice"],
            tags=["infra"],
            context="ctx",
            decision="dec",
            consequences="con",
            options=[Option(id="o1", title="A")],
            supersededBy="old-id",
            sharedWith=["bob@example.com"],
        )
        assert body.superseded_by == "old-id"
        assert body.shared_with == ["bob@example.com"]


# ---------------------------------------------------------------------------
# DecisionUpdate
# ---------------------------------------------------------------------------


class TestDecisionUpdate:
    def test_all_optional(self):
        body = DecisionUpdate()
        dumped = body.model_dump(by_alias=True, exclude_unset=True)
        assert dumped == {}

    def test_partial_update(self):
        body = DecisionUpdate(title="Updated Title")
        dumped = body.model_dump(by_alias=True, exclude_unset=True)
        assert dumped == {"title": "Updated Title"}

    def test_status_update(self):
        body = DecisionUpdate(status=DecisionStatus.deprecated)
        dumped = body.model_dump(by_alias=True, exclude_unset=True)
        assert dumped == {"status": DecisionStatus.deprecated}

    def test_multiple_fields(self):
        body = DecisionUpdate(
            title="New Title",
            tags=["a", "b"],
            status=DecisionStatus.rejected,
        )
        dumped = body.model_dump(by_alias=True, exclude_unset=True)
        assert dumped["title"] == "New Title"
        assert dumped["tags"] == ["a", "b"]
        assert dumped["status"] == DecisionStatus.rejected

    def test_empty_title_rejected(self):
        with pytest.raises(ValidationError):
            DecisionUpdate(title="")


# ---------------------------------------------------------------------------
# ShareRequest / ShareResponse
# ---------------------------------------------------------------------------


class TestShareModels:
    def test_share_request_optional_email(self):
        r = ShareRequest()
        assert r.email is None

    def test_share_request_with_email(self):
        r = ShareRequest(email="alice@example.com")
        assert r.email == "alice@example.com"

    def test_share_response(self):
        r = ShareResponse(url="https://example.com/share/123")
        assert r.url == "https://example.com/share/123"
