from __future__ import annotations

import json
from functools import lru_cache
from typing import Any

from src.knowledge.pack_context import get_current_pack_id
from src.knowledge.pack_paths import normalize_pack_id, pack_json_path


@lru_cache
def _load_pack_file(pack_id: str) -> dict[str, Any]:
    path = pack_json_path(pack_id)
    if not path.is_file():
        return {
            "id": pack_id,
            "vocabulary": [],
            "moduleMap": [],
            "skillPaths": [],
            "corpus": {},
        }
    return json.loads(path.read_text(encoding="utf-8"))


def load_pack(pack_id: str | None = None) -> dict[str, Any]:
    pid = normalize_pack_id(pack_id or get_current_pack_id())
    return _load_pack_file(pid)


def vocabulary_lines(pack_id: str | None = None) -> str:
    nouns = load_pack(pack_id).get("vocabulary") or []
    lines: list[str] = []
    for noun in nouns:
        aliases = ", ".join(noun.get("aliases") or [])
        title = noun.get("title") or noun.get("id")
        ident = noun.get("id")
        extra = f" (aliases: {aliases})" if aliases else ""
        lines.append(f"- {ident}: {title}{extra}")
    return "\n".join(lines)


def concept_ids(pack_id: str | None = None) -> set[str]:
    return {
        str(n.get("id"))
        for n in load_pack(pack_id).get("vocabulary") or []
        if n.get("id")
    }


def clear_pack_cache() -> None:
    _load_pack_file.cache_clear()
