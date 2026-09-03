from __future__ import annotations

import re

from src.models import (
    KnowledgeAnswer,
    KnowledgeStep,
    RetrievedChunk,
    SourceReference,
)


_STEP_RE = re.compile(r"^(?:[-*]|\d+[.)])\s+(.+)$")


def extract_cited_answer(question: str, retrieved: list[RetrievedChunk]) -> KnowledgeAnswer:
    if not retrieved:
        raise ValueError("No retrieved procedures")
    steps: list[KnowledgeStep] = []
    notes: list[str] = []
    for chunk in retrieved[:4]:
        lines = [line.strip() for line in chunk.text.splitlines() if line.strip()]
        for line in lines:
            match = _STEP_RE.match(line)
            if match and len(steps) < 10:
                steps.append(
                    KnowledgeStep(
                        instruction=match.group(1)[:500],
                        detail="",
                        source_ids=[chunk.source_id],
                    )
                )
        if len(steps) >= 8:
            break
    if not steps:
        top = retrieved[0]
        snippet = " ".join(top.text.split())[:400]
        steps.append(
            KnowledgeStep(
                instruction=f"Follow the Help topic: {top.title}",
                detail=snippet,
                source_ids=[top.source_id],
            )
        )
        notes.append("Steps were extracted from Help without an LLM rewrite.")
    sources = [
        SourceReference(
            source_id=chunk.source_id,
            source_url=chunk.source_url,
            title=chunk.title,
            heading_path=chunk.heading_path,
            score=chunk.score,
            pack_concept_ids=list(chunk.pack_concept_ids or []),
        )
        for chunk in retrieved[:8]
    ]
    return KnowledgeAnswer(
        summary=f"Cited Help procedures for: {question.strip()[:180]}",
        steps=steps,
        notes=notes,
        generation_model="extract-okf",
        sources=sources,
    )
