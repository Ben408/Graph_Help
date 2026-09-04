"""Ask evidence selection: scope gates, multi-query fusion, coherent page sets.

Retrieval similarity discovers candidates; it does not authorize an answer.
Coverage is always judged against the original user goal.
"""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field

from config.settings import Settings
from src.llm.client import StructuredLLM
from src.models import Classification, RetrievedChunk
from src.rag.okf.enrich import enrich_retrieved_with_okf
from src.rag.okf.store import OkfStore
from src.rag.rag_retriever import InsufficientEvidenceError, retrieve_help_content
from src.rag.vector_store import VectorStore

MIN_CLASSIFY_CONFIDENCE = 0.35
LOW_CONFIDENCE_FOR_REWRITE = 0.55
MIN_REWRITE_OVERLAP = 0.18
RRF_K = 60
DEFAULT_MAX_PAGES = 4
EXPANDED_MAX_PAGES = 6
MAX_CHUNKS_FOR_GENERATION = 8
# Keep pages that clearly match the question even if cohesion would drop them.
TITLE_PIN_BOOST = 0.85
POSSIBLY_RELATED_MIN_SCORE = 0.35

_STOPWORDS = {
    "the",
    "and",
    "for",
    "with",
    "from",
    "that",
    "this",
    "into",
    "your",
    "our",
    "are",
    "is",
    "was",
    "were",
    "how",
    "do",
    "does",
    "can",
    "what",
    "when",
    "where",
    "why",
    "which",
    "about",
    "using",
    "use",
    "used",
    "a",
    "an",
    "of",
    "to",
    "in",
    "on",
    "my",
    "me",
    "we",
    "i",
    "it",
    "its",
    "or",
    "be",
    "by",
    "at",
    "as",
    "if",
    "not",
    "no",
    "yes",
    "please",
    "help",
    "need",
    "want",
    "sage",
    "intacct",
    "should",
    "check",
    "problem",
    "issue",
    "wrong",
    "match",
    "matches",
    "matching",
    "versus",
    "vs",
    "between",
}

_TASK_VERBS = {
    "reverse",
    "reversing",
    "close",
    "closing",
    "create",
    "creating",
    "edit",
    "editing",
    "delete",
    "deleting",
    "approve",
    "approving",
    "pay",
    "paying",
    "payment",
    "reconcile",
    "reconciling",
    "import",
    "export",
    "configure",
    "configuration",
    "setup",
    "troubleshoot",
    "troubleshooting",
    "void",
    "adjust",
    "adjustment",
    "post",
    "posting",
    "allocate",
    "allocation",
    "consolidate",
    "consolidation",
    "match",
    "matching",
    "enable",
    "disable",
    "investigate",
    "compare",
    "fix",
}

_TROUBLESHOOT_SIGNALS = {
    "why",
    "problem",
    "issue",
    "error",
    "wrong",
    "mismatch",
    "mismatched",
    "discrepancy",
    "difference",
    "differ",
    "doesn't",
    "doesnt",
    "don't",
    "dont",
    "not",
    "match",
    "matching",
    "troubleshoot",
    "troubleshooting",
    "check",
    "investigate",
    "versus",
    "vs",
    "out",
    "balance",
    "balancing",
}

_PRODUCT_ENTITIES = {
    "accounts",
    "payable",
    "receivable",
    "general",
    "ledger",
    "journal",
    "journals",
    "vendor",
    "vendors",
    "customer",
    "customers",
    "bank",
    "cash",
    "budget",
    "budgets",
    "dimension",
    "dimensions",
    "consolidation",
    "entity",
    "entities",
    "subledger",
    "subledgers",
    "ap",
    "ar",
    "gl",
}

_GENERIC_TITLE_TOKENS = {
    "overview",
    "about",
    "introduction",
    "welcome",
    "home",
    "index",
    "basics",
    "getting",
    "started",
    "release",
    "notes",
    "whats",
    "new",
    "changes",
    "configuration",
    "configure",
    "settings",
}


@dataclass
class RankedChunk:
    chunk: RetrievedChunk
    rrf: float = 0.0
    boost: float = 0.0
    provenance: set[str] = field(default_factory=set)

    @property
    def score(self) -> float:
        return self.rrf + self.boost


def tokens(text: str) -> set[str]:
    return {
        token
        for token in "".join(
            ch.lower() if ch.isalnum() else " " for ch in text
        ).split()
        if len(token) > 2 and token not in _STOPWORDS
    }


def token_overlap_ratio(left: set[str], right: set[str]) -> float:
    if not left or not right:
        return 0.0
    return len(left & right) / len(left)


# Short module aliases are dropped by tokens() (len<=2). Expand them so
# "AP/GL mismatch" shares entities with "AP subledger and General Ledger".
_ABBREV_EXPAND: dict[str, set[str]] = {
    "ap": {"ap", "accounts", "payable"},
    "ar": {"ar", "accounts", "receivable"},
    "gl": {"gl", "general", "ledger"},
}


def product_entities(text: str) -> set[str]:
    """Product-domain tokens, including expanded AP/AR/GL abbreviations."""
    raw = {
        token
        for token in "".join(
            ch.lower() if ch.isalnum() else " " for ch in text
        ).split()
        if token and token not in _STOPWORDS
    }
    found = raw & _PRODUCT_ENTITIES
    for abbrev, expanded in _ABBREV_EXPAND.items():
        if abbrev in raw:
            found |= expanded
    return found


def is_troubleshooting_question(question: str) -> bool:
    raw = {
        token
        for token in "".join(
            ch.lower() if ch.isalnum() else " " for ch in question
        ).split()
        if token
    }
    # Keep short negation/signal tokens that normal tokenizer drops.
    raw |= {t for t in question.lower().replace("'", "").split() if t}
    return bool(raw & _TROUBLESHOOT_SIGNALS) or "does not" in question.lower()


_TROUBLESHOOT_TITLE_HINTS = (
    "troubleshoot",
    "discrepan",
    "out of balance",
    "does not match",
    "don't match",
    "mismatch",
    "reconcil",
    "subledger",
    "understanding discrepancies",
    "differences between",
)


def title_symptom_match_score(question: str, chunk: RetrievedChunk) -> float:
    """Promote Help titles that name the domains + discrepancy symptom."""
    if not is_troubleshooting_question(question):
        return 0.0
    title_l = (chunk.title or "").lower()
    heading_l = (chunk.heading_path or "").lower()
    blob = f"{title_l} {heading_l}"
    q_entities = product_entities(question)
    page_entities = product_entities(blob)
    shared = q_entities & page_entities
    hint_hit = any(tip in title_l for tip in _TROUBLESHOOT_TITLE_HINTS)
    if not hint_hit:
        return 0.0
    score = 1.5
    score += 0.75 * len(shared)
    # AP + GL (or AR + GL) both named in the title is decisive.
    if len(shared) >= 2 and len(q_entities) >= 2:
        score += 2.5
    if "subledger" in title_l and ("ledger" in shared or "general" in shared):
        score += 0.75
    return score


def _is_strong_troubleshooting_title(question: str, chunk: RetrievedChunk) -> bool:
    return title_symptom_match_score(question, chunk) >= 3.0


def scope_refuse_reason(question: str, classification: Classification) -> tuple[str | None, str | None]:
    """Return (message, refusal_reason) when classification is weak or goal-changing."""
    if classification.confidence < MIN_CLASSIFY_CONFIDENCE:
        return (
            "Not enough confidence that this is an in-scope Sage Intacct Help question "
            f"(classification confidence {classification.confidence:.2f}).",
            "out_of_scope",
        )

    q_tokens = tokens(question)
    rewrite_tokens = tokens(classification.search_query)
    overlap = token_overlap_ratio(q_tokens, rewrite_tokens)
    q_entities = product_entities(question)
    rewrite_entities = product_entities(classification.search_query)
    lost_entities = q_entities - rewrite_entities

    if (
        classification.confidence < LOW_CONFIDENCE_FOR_REWRITE
        and overlap < MIN_REWRITE_OVERLAP
        and len(q_tokens) >= 3
    ):
        return (
            "The classifier rewrite does not preserve the original goal with enough "
            "confidence to answer from Help.",
            "out_of_scope",
        )

    # Mid-confidence rewrite that drops product entities → ask for clarity later;
    # for now treat as ambiguous rather than answering the rewrite.
    if (
        lost_entities
        and classification.confidence < 0.75
        and overlap < 0.4
        and len(q_entities) >= 2
    ):
        return (
            "The question looks in-scope, but the rewrite dropped key product entities "
            f"({', '.join(sorted(lost_entities))}). Refusing rather than answering a "
            "different goal.",
            "ambiguous",
        )
    return None, None


def _page_key(chunk: RetrievedChunk) -> str:
    return (chunk.source_url or "").split("#", 1)[0].rstrip("/").lower()


def _retrieve_one(
    query: str,
    vector_store: VectorStore,
    llm: StructuredLLM,
    settings: Settings,
    *,
    help_language: str,
) -> list[RetrievedChunk]:
    try:
        return retrieve_help_content(
            query,
            vector_store,
            llm,
            top_k=settings.rag_top_k,
            min_score=settings.rag_min_score,
            language=help_language,
        )
    except InsufficientEvidenceError:
        return []


def fuse_rankings(
    ranked_lists: dict[str, list[RetrievedChunk]],
) -> dict[str, RankedChunk]:
    """Reciprocal rank fusion across query provenance lists."""
    fused: dict[str, RankedChunk] = {}
    for provenance, chunks in ranked_lists.items():
        for rank, chunk in enumerate(chunks, start=1):
            entry = fused.get(chunk.source_id)
            if entry is None:
                entry = RankedChunk(chunk=chunk, provenance={provenance})
                fused[chunk.source_id] = entry
            else:
                entry.provenance.add(provenance)
                if chunk.score > entry.chunk.score:
                    entry.chunk = chunk
            entry.rrf += 1.0 / (RRF_K + rank)
    return fused


def _boost_chunk(question: str, ranked: RankedChunk) -> float:
    q_tokens = tokens(question)
    q_entities = product_entities(question)
    troubleshooting = is_troubleshooting_question(question)
    chunk = ranked.chunk
    title_tokens = tokens(chunk.title)
    heading_tokens = tokens(chunk.heading_path)
    text_tokens = tokens(chunk.text[:1_200])
    page_tokens = title_tokens | heading_tokens
    page_entities = product_entities(
        f"{chunk.title} {chunk.heading_path} {chunk.text[:1_200]}"
    )

    boost = 0.0
    title_overlap = len(q_tokens & title_tokens)
    heading_overlap = len(q_tokens & heading_tokens)
    if title_overlap:
        boost += 0.45 * title_overlap
    if heading_overlap:
        boost += 0.2 * heading_overlap

    coverage = token_overlap_ratio(q_tokens, page_tokens | text_tokens)
    boost += 0.5 * coverage

    # Entity-pair survival: AP + GL style questions need both sides present.
    if len(q_entities) >= 2:
        shared_entities = q_entities & page_entities
        boost += 0.35 * len(shared_entities)
        if shared_entities == q_entities:
            boost += 0.55
        elif len(shared_entities) >= 2:
            boost += 0.25

    q_verbs = q_tokens & _TASK_VERBS
    if q_verbs and (q_verbs & (page_tokens | text_tokens)):
        boost += 0.25

    if chunk.pack_concept_ids:
        boost += 0.12 + 0.04 * min(len(chunk.pack_concept_ids), 3)

    if title_tokens and title_tokens <= q_tokens:
        boost += 0.5
    if q_tokens and title_tokens and len(title_tokens & q_tokens) >= max(2, len(title_tokens) - 1):
        boost += 0.35

    title_l = (chunk.title or "").lower()
    symptom = title_symptom_match_score(question, ranked.chunk)
    if symptom:
        boost += symptom
    if troubleshooting:
        if any(tip in title_l for tip in _TROUBLESHOOT_TITLE_HINTS):
            boost += 0.35
        if "why" in question.lower() and any(
            tip in title_l for tip in ("troubleshoot", "discrepan", "balance", "match")
        ):
            boost += 0.25

    generic = title_tokens & _GENERIC_TITLE_TOKENS
    # Do not let "configure" / "setup" overview pages beat a symptom title match.
    if generic and title_overlap <= 1 and len(q_entities & page_entities) < 2:
        boost -= 0.55 * len(generic)
    if troubleshooting and any(
        tip in title_l for tip in ("configure", "configuration", "set up", "setup", "field descriptions")
    ) and symptom < 1.0:
        boost -= 0.8

    body = (chunk.text or "").strip()
    if len(body) < 80:
        boost -= 0.25
    if body.lower().count("click") > 12 and title_overlap == 0:
        boost -= 0.15

    if "original" in ranked.provenance:
        boost += 0.12
    return boost


def _chunk_supports_goal(question: str, chunk: RetrievedChunk) -> bool:
    q_tokens = tokens(question)
    q_entities = product_entities(question)
    title_tokens = tokens(chunk.title)
    heading_tokens = tokens(chunk.heading_path)
    text_tokens = tokens(chunk.text[:800])
    page_tokens = title_tokens | heading_tokens
    page_entities = product_entities(
        f"{chunk.title} {chunk.heading_path} {chunk.text[:800]}"
    )
    title_hit = len(q_tokens & title_tokens)
    overlap = token_overlap_ratio(q_tokens, page_tokens | text_tokens)

    if title_hit >= 2 or (title_tokens and title_tokens <= q_tokens):
        return True
    if overlap >= 0.28 or (overlap >= 0.18 and title_hit >= 1):
        return True
    if len(q_entities) >= 2 and len(q_entities & page_entities) >= 2:
        return True
    if is_troubleshooting_question(question):
        title_l = (chunk.title or "").lower()
        if _is_strong_troubleshooting_title(question, chunk):
            return True
        if len(q_entities & page_entities) >= 2 and any(
            tip in title_l for tip in _TROUBLESHOOT_TITLE_HINTS
        ):
            return True
        if len(q_tokens & page_tokens) >= 2 and len(q_entities & page_entities) >= 1:
            return True
    if len(q_tokens & page_tokens) >= 2:
        return True
    if (q_tokens & _TASK_VERBS) & page_tokens:
        return True
    return False


def select_coherent_pages(
    question: str,
    fused: dict[str, RankedChunk],
    *,
    max_pages: int = DEFAULT_MAX_PAGES,
) -> list[RetrievedChunk]:
    if not fused:
        return []

    troubleshooting = is_troubleshooting_question(question)
    if troubleshooting:
        max_pages = max(max_pages, 5)

    for ranked in fused.values():
        ranked.boost = _boost_chunk(question, ranked)

    # Title + symptom matches outrank raw vector leaders (e.g. AP/GL discrepancy
    # page sitting 4th behind Configure / overview pages).
    for ranked in fused.values():
        if _is_strong_troubleshooting_title(question, ranked.chunk):
            ranked.boost += 4.0

    # Evaluate the best fused candidate before cohesion pruning.
    best_overall = max(fused.values(), key=lambda item: item.score)
    pin_pages: set[str] = set()
    if _chunk_supports_goal(question, best_overall.chunk) or best_overall.boost >= TITLE_PIN_BOOST:
        pin_pages.add(_page_key(best_overall.chunk))
    for ranked in fused.values():
        if ranked.boost >= TITLE_PIN_BOOST and _chunk_supports_goal(question, ranked.chunk):
            pin_pages.add(_page_key(ranked.chunk))
        if _is_strong_troubleshooting_title(question, ranked.chunk):
            pin_pages.add(_page_key(ranked.chunk))

    by_page: dict[str, list[RankedChunk]] = defaultdict(list)
    for ranked in fused.values():
        by_page[_page_key(ranked.chunk)].append(ranked)

    page_scores: list[tuple[float, str, list[RankedChunk]]] = []
    for page, items in by_page.items():
        page_score = max(item.score for item in items)
        if len(items) > 1:
            page_score += 0.05 * min(len(items), 4)
        if page in pin_pages:
            page_score += 1.0
        page_scores.append((page_score, page, items))

    page_scores.sort(key=lambda row: row[0], reverse=True)
    if not page_scores:
        return []

    top_score = page_scores[0][0]
    top_pack = {
        concept_id
        for item in page_scores[0][2]
        for concept_id in (item.chunk.pack_concept_ids or [])
    }
    cohesion_floor = 0.35 if troubleshooting else 0.45
    selected_pages: list[list[RankedChunk]] = []
    selected_keys: set[str] = set()

    # Always keep pinned supportive pages first.
    for score, page, items in page_scores:
        if page not in pin_pages:
            continue
        selected_pages.append(items)
        selected_keys.add(page)
        if len(selected_pages) >= max_pages:
            break

    for score, page, items in page_scores:
        if page in selected_keys:
            continue
        if len(selected_pages) >= max_pages:
            break
        if selected_pages and score < top_score * cohesion_floor and page not in pin_pages:
            break
        page_pack = {
            concept_id
            for item in items
            for concept_id in (item.chunk.pack_concept_ids or [])
        }
        if (
            len(selected_pages) >= DEFAULT_MAX_PAGES
            and top_pack
            and page_pack.isdisjoint(top_pack)
            and page not in pin_pages
        ):
            continue
        if len(selected_pages) >= EXPANDED_MAX_PAGES:
            break
        selected_pages.append(items)
        selected_keys.add(page)

    selected: list[RankedChunk] = []
    for items in selected_pages:
        selected.extend(sorted(items, key=lambda item: item.score, reverse=True))
    selected.sort(key=lambda item: item.score, reverse=True)

    # Hard-promote strong troubleshooting titles to the front of the generation set.
    strong = [
        item
        for item in selected
        if _is_strong_troubleshooting_title(question, item.chunk)
    ]
    if strong:
        strong_ids = {item.chunk.source_id for item in strong}
        selected = strong + [item for item in selected if item.chunk.source_id not in strong_ids]

    out: list[RetrievedChunk] = []
    for ranked in selected[:MAX_CHUNKS_FOR_GENERATION]:
        out.append(ranked.chunk.model_copy(update={"score": ranked.score}))
    return out


def evidence_covers_goal(question: str, selected: list[RetrievedChunk]) -> str | None:
    """Post-retrieval gate against the original user goal."""
    if not selected:
        return "Not enough Help coverage to answer this product question"

    for chunk in selected[:6]:
        if _chunk_supports_goal(question, chunk):
            return None

    return (
        "Retrieved Help topics do not directly support the original question. "
        "Refusing rather than answering from weakly related pages."
    )


def filter_possibly_related_sources(
    sources: list,
    *,
    min_score: float = POSSIBLY_RELATED_MIN_SCORE,
) -> list:
    """Dedupe by page URL and keep only meaningfully related refuse sources."""
    best_by_page: dict[str, object] = {}
    for source in sources:
        key = _page_key(source)  # type: ignore[arg-type]
        score = float(getattr(source, "score", 0.0) or 0.0)
        if score < min_score:
            continue
        prior = best_by_page.get(key)
        if prior is None or score > float(getattr(prior, "score", 0.0) or 0.0):
            best_by_page[key] = source
    return sorted(
        best_by_page.values(),
        key=lambda item: float(getattr(item, "score", 0.0) or 0.0),
        reverse=True,
    )


def retrieve_and_select_evidence(
    llm: StructuredLLM,
    vector_store: VectorStore,
    okf_store: OkfStore | None,
    settings: Settings,
    *,
    question: str,
    classification_query: str,
    help_language: str,
    plan_followups,
) -> tuple[list[RetrievedChunk], list[str]]:
    """Retrieve with provenance, fuse ranks, enrich, then pick a coherent page set."""
    lists: dict[str, list[RetrievedChunk]] = {}
    original = _retrieve_one(
        question,
        vector_store,
        llm,
        settings,
        help_language=help_language,
    )
    if original:
        lists["original"] = original

    classifier_q = " ".join(classification_query.split()).strip()
    # Preserve product entities from the original question in the classifier query.
    q_entities = product_entities(question)
    rewrite_entities = product_entities(classifier_q)
    missing = q_entities - rewrite_entities
    if missing and classifier_q:
        classifier_q = f"{classifier_q} {' '.join(sorted(missing))}"

    if classifier_q and classifier_q.lower() != question.strip().lower():
        classified = _retrieve_one(
            classifier_q,
            vector_store,
            llm,
            settings,
            help_language=help_language,
        )
        if classified:
            lists["classifier"] = classified
    elif classifier_q and "original" not in lists:
        classified = _retrieve_one(
            classifier_q,
            vector_store,
            llm,
            settings,
            help_language=help_language,
        )
        if classified:
            lists["classifier"] = classified

    # Troubleshooting: extra entity-preserving query when signals are present.
    if is_troubleshooting_question(question) and q_entities:
        entity_query = " ".join(sorted(q_entities))
        if entity_query.lower() not in {
            question.strip().lower(),
            classifier_q.lower(),
        }:
            more = _retrieve_one(
                f"{entity_query} troubleshooting discrepancy",
                vector_store,
                llm,
                settings,
                help_language=help_language,
            )
            if more:
                lists["entities"] = more

    seed = lists.get("original") or lists.get("classifier") or []
    follow_ups = plan_followups(
        llm,
        question=question,
        classification_query=classifier_q or question,
        retrieved=seed[:4],
        help_language=help_language,
    )
    for index, query in enumerate(follow_ups):
        more = _retrieve_one(
            query,
            vector_store,
            llm,
            settings,
            help_language=help_language,
        )
        if more:
            lists[f"followup:{index}"] = more

    if not lists:
        return [], follow_ups

    fused = fuse_rankings(lists)
    id_order = list(fused.keys())
    enriched = enrich_retrieved_with_okf(
        [fused[source_id].chunk for source_id in id_order],
        okf_store,
    )
    for source_id, chunk in zip(id_order, enriched, strict=True):
        fused[source_id].chunk = chunk

    selected = select_coherent_pages(question, fused)
    return selected, follow_ups
