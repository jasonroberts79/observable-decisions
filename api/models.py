"""Pydantic models mirroring the TypeScript Decision / Option schemas."""

from __future__ import annotations

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class DecisionStatus(str, Enum):
    proposed = "proposed"
    accepted = "accepted"
    rejected = "rejected"
    deprecated = "deprecated"
    superseded = "superseded"


class Option(BaseModel):
    id: str
    title: str = Field(min_length=1)
    description: str = ""
    pros: list[str] = []
    cons: list[str] = []
    chosen: bool = False


class Decision(BaseModel):
    id: str
    title: str = Field(min_length=1)
    status: DecisionStatus = DecisionStatus.proposed
    date: str  # YYYY-MM-DD
    deciders: list[str] = []
    tags: list[str] = []
    context: str = ""
    decision: str = ""
    consequences: str = ""
    options: list[Option] = []
    superseded_by: Optional[str] = Field(default=None, alias="supersededBy")
    share_token: Optional[str] = Field(default=None, alias="shareToken")
    created_at: str = Field(alias="createdAt")
    updated_at: str = Field(alias="updatedAt")
    created_by: str = Field(alias="createdBy")
    shared_with: list[str] = Field(default=[], alias="sharedWith")

    model_config = {"populate_by_name": True}


class DecisionMeta(BaseModel):
    id: str
    title: str
    status: DecisionStatus
    date: str
    tags: list[str] = []
    deciders: list[str] = []
    updated_at: str = Field(alias="updatedAt")
    created_by: str = Field(alias="createdBy")

    model_config = {"populate_by_name": True}


def to_meta(d: Decision) -> DecisionMeta:
    return DecisionMeta(
        id=d.id,
        title=d.title,
        status=d.status,
        date=d.date,
        tags=d.tags,
        deciders=d.deciders,
        updatedAt=d.updated_at,
        createdBy=d.created_by,
    )


class DecisionCreate(BaseModel):
    """Body accepted when creating a new decision (no id/timestamps)."""

    title: str = Field(min_length=1)
    status: DecisionStatus = DecisionStatus.proposed
    date: str
    deciders: list[str] = []
    tags: list[str] = []
    context: str = ""
    decision: str = ""
    consequences: str = ""
    options: list[Option] = []
    superseded_by: Optional[str] = Field(default=None, alias="supersededBy")
    shared_with: list[str] = Field(default=[], alias="sharedWith")

    model_config = {"populate_by_name": True}


class DecisionUpdate(BaseModel):
    """Body accepted when updating – every field is optional."""

    title: Optional[str] = Field(default=None, min_length=1)
    status: Optional[DecisionStatus] = None
    date: Optional[str] = None
    deciders: Optional[list[str]] = None
    tags: Optional[list[str]] = None
    context: Optional[str] = None
    decision: Optional[str] = None
    consequences: Optional[str] = None
    options: Optional[list[Option]] = None
    superseded_by: Optional[str] = Field(default=None, alias="supersededBy")
    share_token: Optional[str] = Field(default=None, alias="shareToken")
    shared_with: Optional[list[str]] = Field(default=None, alias="sharedWith")

    model_config = {"populate_by_name": True}


class ShareRequest(BaseModel):
    email: Optional[str] = None


class ShareResponse(BaseModel):
    url: str
