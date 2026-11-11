"""Resolve Intacct page context → pack concepts / skill paths / suggested Ask."""

from __future__ import annotations

import re

from src.knowledge.pack_loader import load_pack

_SPINE = [
    {
        "match": re.compile(r"close\s*books", re.I),
        "module": "General_Ledger",
        "conceptIds": ["close-books", "general-ledger", "reporting-periods"],
        "skillPathIds": ["period-close"],
        "suggestedQuery": "How do I close my books for the period?",
        "mapped": True,
    },
    {
        "match": re.compile(r"journal\s*entr", re.I),
        "module": "General_Ledger",
        "conceptIds": ["journal-entries", "general-ledger"],
        "skillPathIds": ["ledger-foundations"],
        "suggestedQuery": "How do I reverse a journal entry in Sage Intacct?",
        "mapped": True,
    },
    {
        "match": re.compile(r"\bbills?\b|vendor\s*invoice", re.I),
        "module": "Accounts_Payable",
        "conceptIds": ["accounts-payable", "vendors"],
        "skillPathIds": ["procure-to-pay"],
        "suggestedQuery": "How do I enter an Accounts Payable bill?",
        "mapped": True,
    },
]


def resolve_panel_context(
    *,
    module: str | None = None,
    screen: str | None = None,
    title: str | None = None,
    help_url: str | None = None,
) -> dict[str, object]:
    blob = f"{title or ''} {screen or ''}".strip()
    for spine in _SPINE:
        if blob and spine["match"].search(blob):
            return {
                "conceptIds": list(spine["conceptIds"]),
                "skillPathIds": list(spine["skillPathIds"]),
                "suggestedQuery": spine["suggestedQuery"],
                "module": spine.get("module") or module,
                "screen": screen or title,
                "mapped": True,
            }

    pack = load_pack()
    concept_ids: list[str] = []
    mod = (module or "").strip()
    url = (help_url or "").lower()
    for entry in pack.get("moduleMap") or []:
        entry_mod = str(entry.get("module") or "")
        includes = [str(x).lower() for x in (entry.get("urlIncludes") or [])]
        hit = bool(mod and entry_mod == mod)
        if not hit and url:
            hit = any(token in url for token in includes)
        if hit:
            concept_ids.extend(str(x) for x in (entry.get("conceptIds") or []) if x)
            if not mod:
                mod = entry_mod

    # Dedup preserve order
    seen: set[str] = set()
    ordered: list[str] = []
    for cid in concept_ids:
        if cid not in seen:
            seen.add(cid)
            ordered.append(cid)

    path_ids: list[str] = []
    if ordered:
        for path in pack.get("skillPaths") or []:
            step_ids = {step.get("conceptId") for step in path.get("steps") or []}
            if set(ordered) & step_ids:
                path_ids.append(str(path.get("id")))

    return {
        "conceptIds": ordered,
        "skillPathIds": path_ids,
        "suggestedQuery": "",
        "module": mod or None,
        "screen": screen or title,
        "mapped": False,
    }
