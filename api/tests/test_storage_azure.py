"""Unit tests for the Azure Blob Storage backend with mocked Azure SDK."""

from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

import pytest

from models import Decision
from storage.azure_blob import AzureBlobBackend


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _sample_decision(**overrides) -> Decision:
    defaults = dict(
        id="abc123",
        title="Use Redis",
        status="proposed",
        date="2026-03-21",
        deciders=[],
        tags=["cache"],
        context="",
        decision="",
        consequences="",
        options=[],
        createdAt="2026-03-21T00:00:00+00:00",
        updatedAt="2026-03-21T00:00:00+00:00",
        createdBy="test@example.com",
    )
    defaults.update(overrides)
    return Decision.model_validate(defaults)


def _json_bytes(d: Decision) -> bytes:
    return json.dumps(d.model_dump(by_alias=True), indent=2).encode()


def _make_backend() -> AzureBlobBackend:
    """Create an AzureBlobBackend with the Azure SDK fully mocked."""
    with patch("storage.azure_blob.BlobServiceClient") as MockServiceClient:
        mock_service = MagicMock()
        MockServiceClient.from_connection_string.return_value = mock_service

        backend = AzureBlobBackend(
            connection_string="DefaultEndpointsProtocol=https;AccountName=test;AccountKey=dGVzdA==;EndpointSuffix=core.windows.net",
            container="decisions",
        )
    return backend


# ---------------------------------------------------------------------------
# Tests: blob name helpers
# ---------------------------------------------------------------------------


class TestBlobNaming:
    def test_blob_name(self):
        backend = _make_backend()
        assert backend._blob_name("users/alice/", "abc123") == "users/alice/abc123.json"

    def test_blob_name_default_user(self):
        backend = _make_backend()
        assert backend._blob_name("users/default/", "xyz") == "users/default/xyz.json"


# ---------------------------------------------------------------------------
# Tests: get
# ---------------------------------------------------------------------------


class TestGet:
    @pytest.mark.asyncio
    async def test_get_success(self):
        backend = _make_backend()
        decision = _sample_decision()

        mock_blob_client = MagicMock()
        mock_download = MagicMock()
        mock_download.readall.return_value = _json_bytes(decision)
        mock_blob_client.download_blob.return_value = mock_download

        mock_container = backend._service.get_container_client.return_value
        mock_container.get_blob_client.return_value = mock_blob_client

        result = await backend.get("users/test/", "abc123")
        assert result.id == "abc123"
        assert result.title == "Use Redis"
        assert result.tags == ["cache"]

    @pytest.mark.asyncio
    async def test_get_not_found_raises(self):
        backend = _make_backend()

        mock_blob_client = MagicMock()
        mock_blob_client.download_blob.side_effect = Exception("BlobNotFound")

        backend._service.get_container_client.return_value.get_blob_client.return_value = mock_blob_client

        with pytest.raises(Exception, match="BlobNotFound"):
            await backend.get("users/test/", "missing")


# ---------------------------------------------------------------------------
# Tests: put
# ---------------------------------------------------------------------------


class TestPut:
    @pytest.mark.asyncio
    async def test_put_uploads_json(self):
        backend = _make_backend()
        decision = _sample_decision()

        mock_blob_client = MagicMock()
        backend._service.get_container_client.return_value.get_blob_client.return_value = mock_blob_client

        await backend.put("users/test/", "abc123", decision)

        mock_blob_client.upload_blob.assert_called_once()
        args, kwargs = mock_blob_client.upload_blob.call_args
        uploaded_body = args[0]
        parsed = json.loads(uploaded_body)
        assert parsed["id"] == "abc123"
        assert parsed["title"] == "Use Redis"
        assert kwargs["overwrite"] is True


# ---------------------------------------------------------------------------
# Tests: delete
# ---------------------------------------------------------------------------


class TestDelete:
    @pytest.mark.asyncio
    async def test_delete_calls_sdk(self):
        backend = _make_backend()

        mock_blob_client = MagicMock()
        backend._service.get_container_client.return_value.get_blob_client.return_value = mock_blob_client

        await backend.delete("users/test/", "abc123")
        mock_blob_client.delete_blob.assert_called_once_with(delete_snapshots="include")


# ---------------------------------------------------------------------------
# Tests: list
# ---------------------------------------------------------------------------


class TestList:
    @pytest.mark.asyncio
    async def test_list_empty(self):
        backend = _make_backend()

        mock_container = MagicMock()
        mock_container.list_blobs.return_value = []
        backend._service.get_container_client.return_value = mock_container

        result = await backend.list("users/test/")
        assert result == []

    @pytest.mark.asyncio
    async def test_list_returns_sorted_metas(self):
        backend = _make_backend()

        d1 = _sample_decision(id="old", title="Old", updatedAt="2026-01-01T00:00:00+00:00")
        d2 = _sample_decision(id="new", title="New", updatedAt="2026-03-21T00:00:00+00:00")

        blob1 = MagicMock()
        blob1.name = "users/test/old.json"
        blob2 = MagicMock()
        blob2.name = "users/test/new.json"

        mock_container = MagicMock()
        mock_container.list_blobs.return_value = [blob1, blob2]

        # Mock get to return the right decision for each id
        mock_blob_old = MagicMock()
        mock_download_old = MagicMock()
        mock_download_old.readall.return_value = _json_bytes(d1)
        mock_blob_old.download_blob.return_value = mock_download_old

        mock_blob_new = MagicMock()
        mock_download_new = MagicMock()
        mock_download_new.readall.return_value = _json_bytes(d2)
        mock_blob_new.download_blob.return_value = mock_download_new

        def get_blob_client(name):
            if "old" in name:
                return mock_blob_old
            return mock_blob_new

        mock_container.get_blob_client = get_blob_client
        backend._service.get_container_client.return_value = mock_container

        result = await backend.list("users/test/")
        assert len(result) == 2
        # Newest first
        assert result[0].id == "new"
        assert result[1].id == "old"

    @pytest.mark.asyncio
    async def test_list_skips_non_json(self):
        backend = _make_backend()

        blob_txt = MagicMock()
        blob_txt.name = "users/test/readme.txt"

        mock_container = MagicMock()
        mock_container.list_blobs.return_value = [blob_txt]
        backend._service.get_container_client.return_value = mock_container

        result = await backend.list("users/test/")
        assert result == []

    @pytest.mark.asyncio
    async def test_list_skips_malformed_blobs(self):
        backend = _make_backend()

        blob_bad = MagicMock()
        blob_bad.name = "users/test/bad.json"

        mock_container = MagicMock()
        mock_container.list_blobs.return_value = [blob_bad]

        mock_blob_client = MagicMock()
        mock_blob_client.download_blob.side_effect = Exception("corrupt")
        mock_container.get_blob_client.return_value = mock_blob_client
        backend._service.get_container_client.return_value = mock_container

        result = await backend.list("users/test/")
        assert result == []


# ---------------------------------------------------------------------------
# Tests: share
# ---------------------------------------------------------------------------


class TestShare:
    @pytest.mark.asyncio
    async def test_share_with_key_returns_sas_url(self):
        backend = _make_backend()

        mock_blob_client = MagicMock()
        mock_blob_client.url = "https://test.blob.core.windows.net/decisions/users/test/abc123.json"

        mock_container = MagicMock()
        mock_container.get_blob_client.return_value = mock_blob_client
        backend._service.get_container_client.return_value = mock_container

        backend._service.account_name = "test"
        mock_credential = MagicMock()
        mock_credential.account_key = "dGVzdA=="
        backend._service.credential = mock_credential

        with patch("storage.azure_blob.generate_blob_sas", return_value="sig=abc"):
            url = await backend.share("users/test/", "abc123")

        assert url == "https://test.blob.core.windows.net/decisions/users/test/abc123.json?sig=abc"

    @pytest.mark.asyncio
    async def test_share_without_key_falls_back_to_url(self):
        backend = _make_backend()

        mock_blob_client = MagicMock()
        mock_blob_client.url = "https://test.blob.core.windows.net/decisions/users/test/abc123.json"

        mock_container = MagicMock()
        mock_container.get_blob_client.return_value = mock_blob_client
        backend._service.get_container_client.return_value = mock_container

        backend._service.account_name = "test"
        # credential without account_key
        backend._service.credential = MagicMock(spec=[])

        url = await backend.share("users/test/", "abc123")
        assert url == "https://test.blob.core.windows.net/decisions/users/test/abc123.json"


# ---------------------------------------------------------------------------
# Tests: container creation
# ---------------------------------------------------------------------------


class TestContainerInit:
    def test_creates_container_if_missing(self):
        with patch("storage.azure_blob.BlobServiceClient") as MockServiceClient:
            mock_service = MagicMock()
            MockServiceClient.from_connection_string.return_value = mock_service

            mock_container = MagicMock()
            mock_container.exists.return_value = False
            mock_service.get_container_client.return_value = mock_container

            AzureBlobBackend(
                connection_string="DefaultEndpointsProtocol=https;AccountName=x;AccountKey=eA==;EndpointSuffix=core.windows.net",
                container="my-container",
            )

            mock_container.create_container.assert_called_once()

    def test_skips_create_if_exists(self):
        with patch("storage.azure_blob.BlobServiceClient") as MockServiceClient:
            mock_service = MagicMock()
            MockServiceClient.from_connection_string.return_value = mock_service

            mock_container = MagicMock()
            mock_container.exists.return_value = True
            mock_service.get_container_client.return_value = mock_container

            AzureBlobBackend(
                connection_string="DefaultEndpointsProtocol=https;AccountName=x;AccountKey=eA==;EndpointSuffix=core.windows.net",
                container="my-container",
            )

            mock_container.create_container.assert_not_called()
