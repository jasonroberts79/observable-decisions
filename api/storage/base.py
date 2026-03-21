"""Abstract storage backend – mirrors the TypeScript StorageAdapter interface."""

from __future__ import annotations

import abc

from models import Decision, DecisionMeta


class StorageBackend(abc.ABC):
    @abc.abstractmethod
    async def list(self, prefix: str) -> list[DecisionMeta]: ...

    @abc.abstractmethod
    async def get(self, prefix: str, decision_id: str) -> Decision: ...

    @abc.abstractmethod
    async def put(self, prefix: str, decision_id: str, data: Decision) -> None: ...

    @abc.abstractmethod
    async def delete(self, prefix: str, decision_id: str) -> None: ...

    @abc.abstractmethod
    async def share(self, prefix: str, decision_id: str, email: str | None = None) -> str: ...
