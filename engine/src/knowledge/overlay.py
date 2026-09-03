from __future__ import annotations

from src.knowledge.concept_stamp import resolve_pack_concept_ids
from src.knowledge.pack_loader import load_pack
from src.models import AskResult, SourceReference


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


def overlay_ask_result(result: AskResult) -> AskResult:
    sources: list[SourceReference] = list(result.sources or [])
    if result.answer and result.answer.sources:
        sources = list(result.answer.sources)
    ids: set[str] = set()
    for source in sources:
        ids.update(_ids_from_source(source))
    classification = result.classification
    if classification:
        # Classifier feature/help topics are pack ids when constrained; keep them.
        for topic in classification.help_topics or []:
            if topic:
                ids.add(str(topic))
        if classification.feature:
            ids.add(str(classification.feature))
        ids.update(_ids_from_text(classification.search_query or ""))
    path_ids: list[str] = []
    for path in load_pack().get("skillPaths") or []:
        step_ids = {step.get("conceptId") for step in path.get("steps") or []}
        if ids & step_ids:
            path_ids.append(str(path.get("id")))
    result.touched_concept_ids = sorted(ids)
    result.skill_path_ids = path_ids
    return result
