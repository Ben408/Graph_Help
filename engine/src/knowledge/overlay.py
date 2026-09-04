from __future__ import annotations

import re

from src.knowledge.concept_stamp import resolve_pack_concept_ids
from src.knowledge.pack_loader import load_pack
from src.models import AskResult, SourceReference
from src.qa.evidence import filter_possibly_related_sources


def _ids_from_source(source: SourceReference) -> set[str]:
    stamped = [str(x) for x in (source.pack_concept_ids or []) if x]
    if stamped:
        return set(stamped)
    return set(
        resolve_pack_concept_ids(
            page_url=source.source_url,
            title=source.title,
            heading_path=source.heading_path or "",
        )
    )


def _ids_from_text(*texts: str) -> set[str]:
    blob = " ".join(t for t in texts if t).lower()
    ids: set[str] = set()
    for noun in load_pack().get("vocabulary") or []:
        ident = str(noun.get("id") or "")
        title = str(noun.get("title") or "").lower()
        if ident and ident.replace("-", " ") in blob:
            ids.add(ident)
        if title and title in blob:
            ids.add(ident)
        for alias in noun.get("aliases") or []:
            token = str(alias).lower()
            if len(token) >= 4 and token in blob:
                ids.add(ident)
    return ids


_RECONCILE_HINTS = (
    "discrepan",
    "mismatch",
    "out of balance",
    "does not match",
    "don't match",
    "reconcil",
    "subledger",
)


def _blob_has_ap(blob: str) -> bool:
    return (
        "accounts payable" in blob
        or "accounts-payable" in blob
        or bool(re.search(r"(^|[^a-z])ap([^a-z]|$)", blob))
    )


def _blob_has_ar(blob: str) -> bool:
    return (
        "accounts receivable" in blob
        or "accounts-receivable" in blob
        or bool(re.search(r"(^|[^a-z])ar([^a-z]|$)", blob))
    )


def _blob_has_gl(blob: str) -> bool:
    return (
        "general ledger" in blob
        or "general-ledger" in blob
        or bool(re.search(r"(^|[^a-z])gl([^a-z]|$)", blob))
    )


def _prefer_reconcile_paths(
    path_ids: list[str],
    *,
    question: str,
    concept_ids: set[str],
    source_titles: list[str] | None = None,
) -> list[str]:
    """AP/GL (or AR/GL) reconciliation → period-close / ledger-foundations, not O2C."""
    blob = " ".join(
        [question.lower(), *[t.lower() for t in (source_titles or [])]]
    )
    has_gl = "general-ledger" in concept_ids or _blob_has_gl(blob)
    has_ap = "accounts-payable" in concept_ids or _blob_has_ap(blob)
    has_ar = "accounts-receivable" in concept_ids or _blob_has_ar(blob)
    symptom = any(tip in blob for tip in _RECONCILE_HINTS)
    if not (symptom and has_gl and (has_ap or has_ar)):
        return path_ids
    preferred = ["period-close", "ledger-foundations"]
    demoted = {"order-to-cash", "procure-to-pay"}
    ranked = [pid for pid in preferred if pid in path_ids]
    ranked.extend(pid for pid in path_ids if pid not in preferred and pid not in demoted)
    if not ranked:
        ranked = ["period-close"]
    return ranked


def overlay_ask_result(result: AskResult) -> AskResult:
    # Refuses must not recommend Skill Paths or invent pack nouns from weak rewrites.
    if result.status == "refused":
        if result.refusal_reason in {"out_of_scope", "ambiguous"}:
            result.sources = []
            result.okf_concepts = []
            result.touched_concept_ids = []
            result.skill_path_ids = []
            return result
        sources = filter_possibly_related_sources(list(result.sources or []))  # type: ignore[arg-type]
        result.sources = sources  # type: ignore[assignment]
        result.touched_concept_ids = []
        result.skill_path_ids = []
        return result

    sources: list[SourceReference] = list(result.sources or [])
    if result.answer and result.answer.sources:
        sources = list(result.answer.sources)

    ids: set[str] = set()
    for source in sources:
        ids.update(_ids_from_source(source))

    classification = result.classification
    question_blob = ""
    if classification:
        for topic in classification.help_topics or []:
            token = str(topic).strip()
            if token and " " not in token:
                ids.add(token)
        feature = str(classification.feature or "").strip()
        if feature and " " not in feature:
            ids.add(feature)
        ids.update(_ids_from_text(classification.search_query or ""))
        question_blob = " ".join(
            [
                str(classification.search_query or ""),
                str(classification.feature or ""),
                " ".join(str(t) for t in (classification.help_topics or [])),
            ]
        )

    path_ids: list[str] = []
    if ids:
        for path in load_pack().get("skillPaths") or []:
            step_ids = {step.get("conceptId") for step in path.get("steps") or []}
            if ids & step_ids:
                path_ids.append(str(path.get("id")))
        path_ids = _prefer_reconcile_paths(
            path_ids,
            question=question_blob,
            concept_ids=ids,
            source_titles=[s.title for s in sources if getattr(s, "title", None)],
        )

    result.touched_concept_ids = sorted(ids)
    result.skill_path_ids = path_ids
    return result
