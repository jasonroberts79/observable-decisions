"""Azure Blob Storage backend – equivalent to the TypeScript AzureBlobAdapter."""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone

from azure.storage.blob import (
    BlobSasPermissions,
    BlobServiceClient,
    generate_blob_sas,
)

from models import Decision, DecisionMeta, to_meta
from .base import StorageBackend


class AzureBlobBackend(StorageBackend):
    def __init__(self, connection_string: str, container: str) -> None:
        self._service = BlobServiceClient.from_connection_string(connection_string)
        self._container_name = container
        # Ensure the container exists on startup
        container_client = self._service.get_container_client(self._container_name)
        if not container_client.exists():
            container_client.create_container()

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _blob_name(self, prefix: str, decision_id: str) -> str:
        return f"{prefix}{decision_id}.json"

    @property
    def _container(self):
        return self._service.get_container_client(self._container_name)

    def _blob(self, prefix: str, decision_id: str):
        return self._container.get_blob_client(self._blob_name(prefix, decision_id))

    # ------------------------------------------------------------------
    # Interface
    # ------------------------------------------------------------------

    async def list(self, prefix: str) -> list[DecisionMeta]:
        metas: list[DecisionMeta] = []
        for blob_props in self._container.list_blobs(name_starts_with=prefix):
            if not blob_props.name.endswith(".json"):
                continue
            try:
                decision_id = blob_props.name.removeprefix(prefix).removesuffix(".json")
                decision = await self.get(prefix, decision_id)
                metas.append(to_meta(decision))
            except Exception:
                # skip malformed blobs, matching TS behaviour
                continue

        metas.sort(key=lambda m: m.updated_at, reverse=True)
        return metas

    async def get(self, prefix: str, decision_id: str) -> Decision:
        blob_client = self._blob(prefix, decision_id)
        data = blob_client.download_blob().readall()
        return Decision.model_validate_json(data)

    async def put(self, prefix: str, decision_id: str, data: Decision) -> None:
        blob_client = self._blob(prefix, decision_id)
        body = json.dumps(data.model_dump(by_alias=True), indent=2)
        blob_client.upload_blob(body, overwrite=True, content_settings=_json_content())

    async def delete(self, prefix: str, decision_id: str) -> None:
        blob_client = self._blob(prefix, decision_id)
        blob_client.delete_blob(delete_snapshots="include")

    async def share(self, prefix: str, decision_id: str, email: str | None = None) -> str:
        blob_client = self._blob(prefix, decision_id)

        # Try generating a SAS token
        account_name = self._service.account_name
        account_key: str | None = None
        if self._service.credential and hasattr(self._service.credential, "account_key"):
            account_key = self._service.credential.account_key  # type: ignore[attr-defined]

        if account_name and account_key:
            sas_token = generate_blob_sas(
                account_name=account_name,
                container_name=self._container_name,
                blob_name=self._blob_name(prefix, decision_id),
                account_key=account_key,
                permission=BlobSasPermissions(read=True),
                expiry=datetime.now(timezone.utc) + timedelta(days=7),
            )
            return f"{blob_client.url}?{sas_token}"

        # Fall back to the plain blob URL
        return blob_client.url


def _json_content():
    from azure.storage.blob import ContentSettings

    return ContentSettings(content_type="application/json")
