"""Stamp sanity for demo pack nouns + terminology Help pointers.

Usage:

  .\\.venv\\Scripts\\python.exe scripts\\stamp_sanity.py
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

ENGINE_ROOT = Path(__file__).resolve().parents[1]
OKF_CATALOG = ENGINE_ROOT / "data" / "okf" / "catalog.json"
PACK_JSON = ENGINE_ROOT.parent / "packs" / "sage-intacct" / "pack.json"
DEFAULT_OUT = ENGINE_ROOT / "data" / "runs" / "smoke"

DEMO_IDS = (
    "general-ledger",
    "accounts-payable",
    "accounts-receivable",
    "dimensions",
)

DEMO_TITLE_HINTS: dict[str, tuple[str, ...]] = {
    "general-ledger": ("general ledger", "gl overview", "about the general ledger"),
    "accounts-payable": ("accounts payable", "about accounts payable", "ap overview"),
    "accounts-receivable": ("accounts receivable", "about accounts receivable", "ar overview"),
    "dimensions": ("dimension", "about dimensions", "using dimensions"),
}

# High-value Help sources for expanding the concept tree / categories later.
TERMINOLOGY_HELP = (
    {
        "title": "Top must-know Sage Intacct terms",
        "url": "https://www.intacct.com/ia/docs/en_US/help_action/Intacct_basics/New_to_Sage_Intacct/top-terms.htm",
        "role": "Core product nouns + short explanations — primary seed for pack expansion",
    },
    {
        "title": "Glossary",
        "url": "https://www.intacct.com/ia/docs/en_US/help_action/Intacct_basics/Help_and_learning/glossary.htm",
        "role": "Broader Help glossary — secondary seed / alias mining",
    },
    {
        "title": "Sage Intacct terms and concepts (Consoles)",
        "url": "https://www.intacct.com/ia/docs/en_US/help_action/More/Consoles/Console-Practice_setup/SI-terms-and-concepts.htm",
        "role": "Console-oriented terms — use carefully; not all apply to entity companies",
    },
)

_SPECIALIZED = (
    "nonprofit",
    "non-profit",
    "grant",
    "construction",
    "planning",
    "regularization",
    "delegation",
    "approval",
    "checklist",
    "label",
    "outlier",
    "deleting",
    "reversing",
    " report",
    "groups",
    "group",
    "field description",
    "configure",
    "set up",
    "setup",
)


def _load_catalog() -> list[dict[str, Any]]:
    if not OKF_CATALOG.is_file():
        raise FileNotFoundError(f"Missing OKF catalog: {OKF_CATALOG}")
    data = json.loads(OKF_CATALOG.read_text(encoding="utf-8"))
    return list(data.get("concepts") or [])


def _rank(concept_id: str, item: dict[str, Any]) -> tuple:
    kind = str(item.get("type") or "")
    title = str(item.get("title") or "").lower()
    hints = DEMO_TITLE_HINTS.get(concept_id, ())
    # Prefer short overview-style titles that name the noun itself.
    title_hit = 0 if any(h in title for h in hints) else 1
    id_words = [w for w in concept_id.split("-") if len(w) > 3]
    if title_hit == 1 and id_words and all(w in title for w in id_words):
        title_hit = 0
    # Exact-ish overviews beat "About X in Module" procedures.
    overviewish = title.startswith("about ") and len(title) < 60
    specialized = any(tip in title for tip in _SPECIALIZED)
    overview = any(tip in title for tip in ("overview", "about", "basics", "what is"))
    kind_rank = 0 if kind == "HelpTopic" else 1 if kind == "HelpSection" else 2
    length_penalty = 0 if len(title) < 55 else 1
    return (
        title_hit,
        1 if specialized else 0,
        0 if overviewish else 1,
        0 if overview else 1,
        kind_rank,
        length_penalty,
        title,
    )


def check_concept(concept_id: str, items: list[dict[str, Any]]) -> dict[str, Any]:
    stamped = [i for i in items if concept_id in (i.get("pack_concept_ids") or [])]
    if not stamped:
        return {
            "concept_id": concept_id,
            "ok": False,
            "stamped_count": 0,
            "issues": ["No OKF pages stamped with this pack_concept_id"],
        }
    primary = sorted(stamped, key=lambda item: _rank(concept_id, item))[0]
    url = primary.get("page_url") or primary.get("source_url") or ""
    hierarchy = (
        primary.get("heading_path")
        or primary.get("path")
        or primary.get("parent_topic")
        or ""
    )
    issues: list[str] = []
    if not url:
        issues.append("Primary stamped page has no page_url")
    help_topics = [i for i in stamped if i.get("type") == "HelpTopic"]
    if not help_topics:
        issues.append("No HelpTopic stamps (only Procedure/Section) — overview may be weak")
    primary_title = str(primary.get("title") or "").lower()
    hints = DEMO_TITLE_HINTS.get(concept_id, ())
    id_words = [w for w in concept_id.split("-") if len(w) > 3]
    titled_ok = any(h in primary_title for h in hints) or (
        bool(id_words) and all(w in primary_title for w in id_words)
    )
    if not titled_ok:
        issues.append(
            f"Primary title looks off-noun ({primary.get('title')!r}) — "
            "stamps exist but overview ranking is weak"
        )
    return {
        "concept_id": concept_id,
        "ok": len(issues) == 0,
        "stamped_count": len(stamped),
        "help_topic_count": len(help_topics),
        "primary": {
            "title": primary.get("title"),
            "type": primary.get("type"),
            "url": url,
            "hierarchy": hierarchy,
        },
        "issues": issues,
    }


def find_terminology_in_catalog(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    found: list[dict[str, Any]] = []
    for tip in TERMINOLOGY_HELP:
        match = next(
            (
                i
                for i in items
                if (i.get("page_url") or "") == tip["url"] and i.get("type") == "HelpTopic"
            ),
            None,
        )
        found.append(
            {
                **tip,
                "in_okf": bool(match),
                "okf_title": (match or {}).get("title"),
                "pack_concept_ids": (match or {}).get("pack_concept_ids") or [],
            }
        )
    return found


def main() -> int:
    parser = argparse.ArgumentParser(description="Stamp sanity for demo nouns")
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT)
    parser.add_argument(
        "--concept",
        action="append",
        dest="concepts",
        help="Extra concept id (repeatable); default is demo set",
    )
    args = parser.parse_args()
    args.out_dir.mkdir(parents=True, exist_ok=True)

    concept_ids = list(args.concepts or DEMO_IDS)
    try:
        items = _load_catalog()
    except Exception as exc:  # noqa: BLE001
        print(f"FATAL: {exc}", file=sys.stderr)
        return 2

    vocab = []
    if PACK_JSON.is_file():
        pack = json.loads(PACK_JSON.read_text(encoding="utf-8"))
        vocab = [str(n.get("id")) for n in (pack.get("vocabulary") or []) if n.get("id")]

    rows = [check_concept(cid, items) for cid in concept_ids]
    terminology = find_terminology_in_catalog(items)
    hard_fails = [r for r in rows if not r["ok"]]

    payload = {
        "generated_at": datetime.now(UTC).isoformat(),
        "demo_concepts": rows,
        "vocabulary_count": len(vocab),
        "terminology_help": terminology,
        "hard_fail_count": len(hard_fails),
        "note": (
            "Terminology Help pages are seeds for later concept-tree / category expansion; "
            "do not auto-import into packs without editorial review."
        ),
    }
    stamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    json_path = args.out_dir / f"stamp_sanity_{stamp}.json"
    latest = args.out_dir / "stamp_sanity_latest.json"
    json_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    latest.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    lines = [
        "# Stamp sanity",
        "",
        f"Generated: {payload['generated_at']}",
        f"Hard fails: {len(hard_fails)}",
        "",
        "## Demo nouns",
        "",
    ]
    for row in rows:
        mark = "OK" if row["ok"] else "FAIL"
        lines.append(f"### `{row['concept_id']}` — **{mark}** ({row['stamped_count']} stamped)")
        primary = row.get("primary") or {}
        if primary:
            lines.append(f"- primary: {primary.get('title')} (`{primary.get('type')}`)")
            lines.append(f"- url: {primary.get('url')}")
            lines.append(f"- hierarchy: {primary.get('hierarchy')}")
        for issue in row.get("issues") or []:
            lines.append(f"- issue: {issue}")
        lines.append("")
    lines.append("## Terminology Help (concept-tree expansion seed)")
    lines.append("")
    for tip in terminology:
        present = "in OKF" if tip["in_okf"] else "URL not found as HelpTopic in OKF"
        lines.append(f"- **{tip['title']}** — {present}")
        lines.append(f"  - {tip['url']}")
        lines.append(f"  - {tip['role']}")
    lines.append("")
    md_path = args.out_dir / f"stamp_sanity_{stamp}.md"
    latest_md = args.out_dir / "stamp_sanity_latest.md"
    md_path.write_text("\n".join(lines), encoding="utf-8")
    latest_md.write_text("\n".join(lines), encoding="utf-8")

    for row in rows:
        print(
            f"{row['concept_id']}: {'OK' if row['ok'] else 'FAIL'} "
            f"stamped={row['stamped_count']} primary={((row.get('primary') or {}).get('title'))}"
        )
    print(f"Wrote {json_path}")
    print(f"Wrote {md_path}")
    return 1 if hard_fails else 0


if __name__ == "__main__":
    raise SystemExit(main())
