from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from config.settings import get_settings


@lru_cache
def load_pack() -> dict[str, Any]:
    path = get_settings().pack_path
    if not path.is_file():
        return {
            "id": "unknown",
            "vocabulary": [],
            "moduleMap": [],
            "skillPaths": [],
            "corpus": {},
        }
    return json.loads(path.read_text(encoding="utf-8"))


def vocabulary_lines() -> str:
    nouns = load_pack().get("vocabulary") or []
    lines: list[str] = []
    for noun in nouns:
        aliases = ", ".join(noun.get("aliases") or [])
        title = noun.get("title") or noun.get("id")
        ident = noun.get("id")
        extra = f" (aliases: {aliases})" if aliases else ""
        lines.append(f"- {ident}: {title}{extra}")
    return "\n".join(lines)


def concept_ids() -> set[str]:
    return {str(n.get("id")) for n in load_pack().get("vocabulary") or [] if n.get("id")}
