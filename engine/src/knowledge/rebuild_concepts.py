"""Rebuild pack concept-page copy from current OKF Help (curriculum, not how-tos)."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

from pydantic import BaseModel, Field

from config.settings import Settings, get_settings
from src.knowledge.concept_stamp import CONCEPT_PATH_FRAGMENTS
from src.knowledge.pack_loader import load_pack
from src.llm.client import LLMResponseError, OllamaClient
from src.rag.okf.store import OkfStore

PACK_DIR = Path(__file__).resolve().parents[2].parent / "packs" / "sage-intacct"
GENERATED_PATH = PACK_DIR / "concepts.generated.json"

_STEP_RE = re.compile(r"^(?:[-*]|\d+[.)]|go to\b|select\b)", re.IGNORECASE)


class ConceptDraft(BaseModel):
    summary: str = Field(min_length=40, max_length=400)
    why_it_matters: str = Field(min_length=40, max_length=900)
    key_details: list[str] = Field(min_length=3, max_length=8)


SYSTEM = """You write curriculum copy for a Sage Intacct product noun on a concept-graph page.
Use ONLY the supplied Help excerpts. Do not invent product behavior.
This is not a how-to: no click paths, no numbered steps, no "Go to …".

Prioritize foundational, everyday accountant usage over specialized scenarios.
Prefer overview / HelpTopic material. Do NOT let niche procedures dominate a broad noun:
avoid leading with nonprofit-only, regional-only, Planning integration, approval workflows,
adjustments-only, report-catalog-only, or dimension-groups-only characterizations unless
the noun itself is that niche topic.

summary: 1-2 sentences defining what the thing is in ordinary Intacct use.
why_it_matters: why a typical accountant or controller should care, grounded in Help.
key_details ("When you use it"): 4-7 bullets of common capabilities and constraints.
Put rare/specialized points last or omit them if space is limited.
If Help is thin, stay short and conservative."""


@dataclass
class RebuildSummary:
    generated: int
    fallback: int
    skipped: int
    path: str
    model: str


def _sentences(text: str, limit: int = 6) -> list[str]:
    parts: list[str] = []
    for raw in re.split(r"(?<=[.!?])\s+", " ".join(text.split())):
        line = raw.strip()
        if len(line) < 40 or _STEP_RE.match(line):
            continue
        parts.append(line[:240])
        if len(parts) >= limit:
            break
    return parts


_SPECIALIZED_TITLE_HINTS = (
    "nonprofit",
    "non-profit",
    "regularization",
    "delegation",
    "planning",
    "region",
    "territory",
    "adjustment",
    "approv",
    "dimension group",
)

# When rebuilding a broad noun, drop excerpt titles that are clearly another topic.
_CONCEPT_TITLE_MUST_MATCH: dict[str, tuple[str, ...]] = {
    "dimensions": ("dimension",),
    "general-ledger": ("general ledger", "ledger", "gl "),
    "accounts-payable": ("accounts payable", "payable", "vendor", " ap"),
    "accounts-receivable": ("accounts receivable", "receivable", "customer", " ar"),
}


def _excerpt(store: OkfStore, concept_id: str, title: str = "") -> tuple[str, list[str]]:
    types = ("HelpTopic", "Procedure", "HelpSection")
    rows = store.catalog_for_pack_concept(concept_id, types=types, limit=16)
    if not rows:
        rows = store.catalog_matching_url_fragments(
            CONCEPT_PATH_FRAGMENTS.get(concept_id, []),
            types=types,
            limit=16,
        )
    if not rows and title:
        rows = [
            item
            for item in store.list_concepts(query=title, limit=40)
            if str(item.get("type") or "") in types
        ][:16]

    must = _CONCEPT_TITLE_MUST_MATCH.get(concept_id)
    if must:
        filtered = [
            row
            for row in rows
            if any(tip in str(row.get("title") or "").lower() for tip in must)
        ]
        if filtered:
            rows = filtered

    def _row_rank(row: dict) -> tuple[int, int, int, int, str]:
        kind = str(row.get("type") or "")
        row_title = str(row.get("title") or "").lower()
        specialized = any(tip in row_title for tip in _SPECIALIZED_TITLE_HINTS)
        title_words = {w for w in title.lower().split() if len(w) > 3}
        title_hit = 0 if (title_words and any(w in row_title for w in title_words)) else 1
        overview = any(
            tip in row_title
            for tip in ("overview", "about", "basics", "what is", title.lower())
        )
        # Prefer HelpTopic overviews; demote specialized procedures.
        kind_rank = 0 if kind == "HelpTopic" else 1 if kind == "HelpSection" else 2
        return (title_hit, 1 if specialized else 0, 0 if overview else 1, kind_rank, row_title)

    rows = sorted(rows, key=_row_rank)

    urls: list[str] = []
    blocks: list[str] = []
    for row in rows:
        concept = store.get_concept(str(row.get("concept_id") or ""))
        if concept is None or not concept.body.strip():
            continue
        url = concept.page_url
        if url and url not in urls:
            urls.append(url)
        kind = concept.type
        body = concept.body.strip()
        if kind == "Procedure":
            lines = [ln.strip() for ln in body.splitlines() if ln.strip()]
            kept = [ln for ln in lines if not _STEP_RE.match(ln)][:6]
            body = "\n".join(kept) or concept.title
        if len(body) > 1400:
            body = body[:1400].rsplit(" ", 1)[0] + "…"
        blocks.append(f"### {concept.title} ({kind})\n{body}")
        if len(blocks) >= 5:
            break
    return "\n\n".join(blocks), urls


def _fallback_draft(title: str, excerpt: str) -> ConceptDraft:
    sentences = _sentences(excerpt)
    summary = sentences[0] if sentences else f"{title} is documented in Sage Intacct Help."
    if len(summary) < 40:
        summary = f"{title} is a Sage Intacct capability described in current Help."
    why = (
        sentences[1]
        if len(sentences) > 1
        else f"Understanding {title} helps you use Help and the product map without mixing it up with adjacent modules."
    )
    details = sentences[2:7] or [
        f"See current Help topics tagged to {title}.",
        "This copy was extracted from Help without an LLM rewrite.",
        "Re-run concept rebuild when Gemma is available for a fuller draft.",
    ]
    while len(details) < 3:
        details.append(f"{title} is linked from the live Help corpus.")
    return ConceptDraft(summary=summary[:400], why_it_matters=why[:900], key_details=details[:8])


def rebuild_concept_pages(
    *,
    settings: Settings | None = None,
    store: OkfStore | None = None,
    output_path: Path | None = None,
    llm: OllamaClient | None = None,
    concept_ids: list[str] | None = None,
) -> RebuildSummary:
    settings = settings or get_settings()
    store = store or OkfStore(settings.okf_dir)
    output_path = output_path or GENERATED_PATH
    pack = load_pack()
    nouns = [n for n in (pack.get("vocabulary") or []) if n.get("id")]
    if concept_ids:
        wanted = set(concept_ids)
        nouns = [n for n in nouns if str(n.get("id")) in wanted]
    client = llm or OllamaClient(
        base_url=settings.ollama_base_url,
        chat_model=settings.ollama_chat_model,
        embed_model=settings.ollama_embed_model,
        fallback_model=None,
        timeout_seconds=min(settings.ollama_timeout_seconds, 90),
    )
    # Merge into existing generated file when rebuilding a subset.
    existing_by_id: dict[str, dict[str, object]] = {}
    if output_path.is_file() and concept_ids:
        try:
            prior = json.loads(output_path.read_text(encoding="utf-8"))
            for row in prior.get("concepts") or []:
                if isinstance(row, dict) and row.get("id"):
                    existing_by_id[str(row["id"])] = row
        except json.JSONDecodeError:
            existing_by_id = {}
    generated: list[dict[str, object]] = []
    fallback = 0
    skipped = 0
    model_used = client.chat_model
    for noun in nouns:
        ident = str(noun.get("id"))
        title = str(noun.get("title") or ident)
        excerpt, urls = _excerpt(store, ident, title)
        if not excerpt.strip():
            skipped += 1
            print(f"concept {ident}: skipped (no Help excerpt)", flush=True)
            continue
        draft: ConceptDraft | None = None
        try:
            user = (
                f"Concept id: {ident}\nTitle: {title}\n"
                f"Write foundational curriculum copy for everyday Intacct use.\n\n"
                f"Help excerpts:\n{excerpt[:6000]}"
            )
            draft, model_used = client.generate_structured(SYSTEM, user, ConceptDraft)
            print(f"concept {ident}: gemma", flush=True)
        except (LLMResponseError, Exception):
            draft = _fallback_draft(title, excerpt)
            fallback += 1
            model_used = "extract-okf"
            print(f"concept {ident}: extract fallback", flush=True)
        generated.append(
            {
                "id": ident,
                "summary": draft.summary.strip(),
                "whyItMatters": draft.why_it_matters.strip(),
                "keyDetails": [item.strip() for item in draft.key_details if item.strip()],
                "sourceUrls": urls[:6],
                "model": model_used,
            }
        )
    if existing_by_id:
        for row in generated:
            existing_by_id[str(row["id"])] = row
        generated = list(existing_by_id.values())
    payload = {
        "generatedAt": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        "model": client.chat_model,
        "concepts": generated,
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    return RebuildSummary(
        generated=len(generated),
        fallback=fallback,
        skipped=skipped,
        path=str(output_path),
        model=client.chat_model,
    )


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Rebuild concept page curriculum copy")
    parser.add_argument(
        "--concept",
        action="append",
        dest="concepts",
        help="Limit to concept id (repeatable)",
    )
    args = parser.parse_args()
    summary = rebuild_concept_pages(concept_ids=args.concepts)
    print(summary)
