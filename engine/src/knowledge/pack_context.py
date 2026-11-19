"""Request-scoped active pack id (Ask / refresh)."""

from __future__ import annotations

from contextlib import contextmanager
from contextvars import ContextVar
from typing import Iterator

from src.knowledge.pack_paths import DEFAULT_PACK_ID, normalize_pack_id

_current_pack_id: ContextVar[str] = ContextVar(
    "graph_help_pack_id", default=DEFAULT_PACK_ID
)


def get_current_pack_id() -> str:
    return normalize_pack_id(_current_pack_id.get())


@contextmanager
def active_pack(pack_id: str | None) -> Iterator[str]:
    token = _current_pack_id.set(normalize_pack_id(pack_id))
    try:
        yield get_current_pack_id()
    finally:
        _current_pack_id.reset(token)
