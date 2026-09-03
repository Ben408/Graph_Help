from __future__ import annotations

from uuid import uuid4

from src.knowledge.overlay import overlay_ask_result
from src.knowledge.pack_loader import load_pack
from src.models import AskResult, Classification, IssueInput, OkfConceptRef, RetrievedChunk
from src.qa.extract_answer import extract_cited_answer
from src.rag.okf.enrich import related_concepts_for_sources
from src.rag.okf.store import OkfStore


def _score_title(query: str, title: str) -> float:
    q = {part for part in query.lower().split() if len(part) > 2}
    t = {part for part in title.lower().split() if len(part) > 2}
    if not q or not t:
        return 0.0
    return len(q & t) / len(q)


def lexical_retrieve(store: OkfStore, query: str, limit: int = 6) -> list[RetrievedChunk]:
    rows = store.list_concepts(concept_type="Procedure", query=query, limit=80)
    if not rows:
        rows = store.list_concepts(query=query, limit=80)
    ranked = sorted(
        rows,
        key=lambda item: _score_title(query, str(item.get("title") or "")),
        reverse=True,
    )
    chunks: list[RetrievedChunk] = []
    for item in ranked:
        concept = store.get_concept(str(item.get("concept_id") or ""))
        if concept is None or not concept.body.strip():
            continue
        score = _score_title(query, concept.title)
        if score < 0.15:
            continue
        chunks.append(
            RetrievedChunk(
                source_id=concept.concept_id,
                text=concept.body,
                source_url=concept.page_url,
                title=concept.title,
                heading_path=concept.heading_path,
                score=score,
            )
        )
        if len(chunks) >= limit:
            break
    return chunks


def lexical_ask(question: IssueInput, okf_store: OkfStore | None) -> AskResult:
    ask_id = f"ask-{uuid4()}"
    if okf_store is None or not okf_store.available:
        return AskResult(
            ask_id=ask_id,
            status="refused",
            coverage_gap="Help corpus is not ingested yet. Run Re-ingest Help or bootstrap from an existing OKF bundle.",
            error_code="INSUFFICIENT_HELP_COVERAGE",
        )
    retrieved = lexical_retrieve(okf_store, question.text)
    pack = load_pack()
    vocab = [str(n.get("title") or n.get("id")) for n in pack.get("vocabulary") or []]
    classification = Classification(
        feature=vocab[0] if vocab else "general",
        intent="how-to",
        task_type="procedure",
        help_topics=[question.text[:80]],
        search_query=question.text,
        confidence=0.4,
        model="lexical",
    )
    if not retrieved:
        result = AskResult(
            ask_id=ask_id,
            status="refused",
            classification=classification,
            coverage_gap="No matching Help procedures were found in the current OKF bundle.",
            error_code="INSUFFICIENT_HELP_COVERAGE",
        )
        return overlay_ask_result(result)
    answer = extract_cited_answer(question.text, retrieved)
    result = AskResult(
        ask_id=ask_id,
        status="completed",
        classification=classification,
        answer=answer,
        sources=answer.sources,
        okf_concepts=[
            OkfConceptRef.model_validate(item)
            for item in related_concepts_for_sources(answer.sources, okf_store)
        ],
    )
    return overlay_ask_result(result)
