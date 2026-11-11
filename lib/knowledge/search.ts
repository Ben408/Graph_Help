import type { Concept, ConceptHit, ContentPack, SkillPath } from "./types";

/** Function words + product brand that should not block natural-language Find. */
const STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "of",
  "in",
  "on",
  "for",
  "to",
  "is",
  "are",
  "was",
  "be",
  "do",
  "does",
  "did",
  "how",
  "what",
  "when",
  "where",
  "why",
  "who",
  "which",
  "can",
  "i",
  "my",
  "me",
  "we",
  "you",
  "it",
  "this",
  "that",
  "with",
  "from",
  "about",
  "into",
  "over",
  "please",
  "explain",
  "tell",
  "show",
  "help",
  "using",
  "use",
  "get",
  "make",
  "sage",
  "intacct",
]);

function haystack(concept: Concept): {
  title: string;
  aliases: string[];
  id: string;
  summary: string;
  category: string;
  rest: string;
} {
  return {
    title: concept.title.toLowerCase(),
    aliases: (concept.aliases ?? []).map((a) => a.toLowerCase()),
    id: concept.id.toLowerCase().replace(/-/g, " "),
    summary: concept.summary.toLowerCase(),
    category: concept.category.toLowerCase(),
    rest: [
      concept.whyItMatters,
      ...(concept.keyDetails ?? []),
      ...(concept.examples ?? []),
      ...(concept.tasks ?? []),
    ]
      .join(" ")
      .toLowerCase(),
  };
}

/** Meaningful tokens for Find / Ask routing (drops stopwords). */
export function significantTokens(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

function fieldHasToken(field: string, token: string): boolean {
  if (field.includes(token)) return true;
  // singular/plural light match: account ↔ accounts
  if (token.endsWith("s") && field.includes(token.slice(0, -1))) return true;
  if (!token.endsWith("s") && field.includes(`${token}s`)) return true;
  return false;
}

export function scoreConcept(concept: Concept, query: string): number {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return 0;
  const h = haystack(concept);
  if (h.title === q || concept.id === q) return 100;
  if (h.aliases.some((a) => a === q)) return 90;
  if (h.title.startsWith(q)) return 80;
  if (h.title.includes(q)) return 70;
  if (h.aliases.some((a) => a.includes(q) || q.includes(a))) return 60;
  if (h.id.includes(q)) return 55;
  if (h.summary.includes(q)) return 40;
  if (h.category.includes(q)) return 30;
  if (h.rest.includes(q)) return 20;

  // Natural-language questions: score by significant tokens, not the whole string.
  const tokens = significantTokens(q);
  if (tokens.length === 0) return 0;

  let best = 0;
  let titleHits = 0;
  let aliasHits = 0;
  let bodyHits = 0;
  for (const token of tokens) {
    const exactAlias = h.aliases.some((a) => a === token);
    if (exactAlias) {
      aliasHits += 1;
      best = Math.max(best, 88);
      continue;
    }
    if (fieldHasToken(h.title, token) || fieldHasToken(h.id, token)) {
      titleHits += 1;
      // Prefer title that is essentially the token (e.g. not only a longer compound).
      const titleIsTokenish =
        h.title === token ||
        h.title.split(/\s+/).includes(token) ||
        h.title.split(/\s+/).includes(`${token}s`);
      best = Math.max(best, titleIsTokenish ? 72 : 58);
    } else if (h.aliases.some((a) => fieldHasToken(a, token))) {
      aliasHits += 1;
      best = Math.max(best, 62);
    } else if (fieldHasToken(h.summary, token) || fieldHasToken(h.rest, token)) {
      bodyHits += 1;
      best = Math.max(best, 38);
    } else if (fieldHasToken(h.category, token)) {
      best = Math.max(best, 28);
    }
  }

  if (titleHits === tokens.length && tokens.length >= 1) {
    best = Math.max(best, 75);
  } else if (titleHits + aliasHits >= 1 && tokens.length <= 3) {
    best = Math.max(best, 65);
  } else if (titleHits + aliasHits + bodyHits >= 2) {
    best = Math.max(best, 50);
  }

  return best;
}

export function searchConcepts(pack: ContentPack, query: string): Concept[] {
  return searchConceptHits(pack, query).map((hit) => hit.concept);
}

export function searchConceptHits(pack: ContentPack, query: string): ConceptHit[] {
  const q = query.trim();
  if (q.length < 2) return [];
  return pack.concepts
    .map((concept) => ({ concept, score: scoreConcept(concept, q) }))
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.concept.title.localeCompare(b.concept.title));
}

export function matchSkillPaths(pack: ContentPack, query: string): SkillPath[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const reconcile =
    /(discrepan|mismatch|out of balance|does not match|don't match|reconcil|subledger)/.test(
      q,
    );
  const hasGl = /\b(gl|general ledger)\b/.test(q);
  const hasAp = /\b(ap|accounts payable)\b/.test(q);
  const hasAr = /\b(ar|accounts receivable)\b/.test(q);
  const preferClose = reconcile && hasGl && (hasAp || hasAr);
  const tokens = significantTokens(q);

  const hits = pack.skillPaths.filter((path) => {
    if (preferClose && (path.id === "order-to-cash" || path.id === "procure-to-pay")) {
      return false;
    }
    const blob = [
      path.title,
      path.summary,
      path.audience,
      path.goal,
      ...path.steps.map((s) => s.rationale),
    ]
      .join(" ")
      .toLowerCase();
    if (blob.includes(q) || path.id.replace(/-/g, " ").includes(q)) return true;
    if (tokens.length > 0 && tokens.every((t) => blob.includes(t))) return true;
    return path.steps.some((step) => {
      const concept = pack.concepts.find((c) => c.id === step.conceptId);
      return concept ? scoreConcept(concept, q) >= 55 : false;
    });
  });

  if (!preferClose) return hits;
  const preferred = ["period-close", "ledger-foundations"];
  return [
    ...hits.filter((p) => preferred.includes(p.id)),
    ...hits.filter((p) => !preferred.includes(p.id)),
  ];
}

export function vocabularyIdsForQuery(pack: ContentPack, query: string): string[] {
  const hits = searchConceptHits(pack, query);
  const ids = new Set<string>();
  for (const hit of hits) {
    if (hit.score >= 40) ids.add(hit.concept.id);
  }
  const lower = query.toLowerCase();
  for (const concept of pack.concepts) {
    for (const alias of concept.aliases ?? []) {
      const token = alias.toLowerCase();
      if (token.length >= 2 && (lower.includes(token) || lower.includes(concept.id))) {
        ids.add(concept.id);
      }
    }
  }
  return [...ids];
}
