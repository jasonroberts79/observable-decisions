"""Google Cloud Storage backend."""

from __future__ import annotations

import json
from datetime import timedelta

import google.auth
import google.auth.transport.requests
from google.cloud import storage

from models import Decision, DecisionMeta, to_meta
from .base import StorageBackend


class GCSBackend(StorageBackend):
    def __init__(self, bucket_name: str) -> None:
        self._client = storage.Client()
        self._bucket_name = bucket_name

    def _blob_name(self, prefix: str, decision_id: str) -> str:
        return f"{prefix}{decision_id}.json"

    def _blob(self, prefix: str, decision_id: str) -> storage.Blob:
        return self._client.bucket(self._bucket_name).blob(
            self._blob_name(prefix, decision_id)
        )

    async def list(self, prefix: str) -> list[DecisionMeta]:
        metas: list[DecisionMeta] = []
        for blob in self._client.list_blobs(self._bucket_name, prefix=prefix):
            if not blob.name.endswith(".json"):
                continue
            try:
                decision_id = blob.name.removeprefix(prefix).removesuffix(".json")
                decision = await self.get(prefix, decision_id)
                metas.append(to_meta(decision))
            except Exception:
                continue
        metas.sort(key=lambda m: m.updated_at, reverse=True)
        return metas

    async def get(self, prefix: str, decision_id: str) -> Decision:
        blob = self._blob(prefix, decision_id)
        data = blob.download_as_text()
        return Decision.model_validate_json(data)

    async def put(self, prefix: str, decision_id: str, data: Decision) -> None:
        blob = self._blob(prefix, decision_id)
        body = json.dumps(data.model_dump(by_alias=True), indent=2)
        blob.upload_from_string(body, content_type="application/json")

    async def delete(self, prefix: str, decision_id: str) -> None:
        blob = self._blob(prefix, decision_id)
        blob.delete()

    async def share(self, prefix: str, decision_id: str, email: str | None = None) -> str:
        blob = self._blob(prefix, decision_id)

        try:
            credentials, _ = google.auth.default(
                scopes=["https://www.googleapis.com/auth/cloud-platform"]
            )
            credentials.refresh(google.auth.transport.requests.Request())

            return blob.generate_signed_url(
                version="v4",
                expiration=timedelta(days=7),
                method="GET",
                service_account_email=credentials.service_account_email,
                access_token=credentials.token,
            )
        except Exception:
            # Fallback: return the GCS URI (not publicly accessible for private buckets)
            return f"https://storage.googleapis.com/{self._bucket_name}/{blob.name}"
