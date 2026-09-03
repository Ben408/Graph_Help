import type { Concept, ConceptHit, ContentPack, SkillPath } from "./types";

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
  return 0;
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
  return pack.skillPaths.filter((path) => {
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
    return path.steps.some((step) => {
      const concept = pack.concepts.find((c) => c.id === step.conceptId);
      return concept ? scoreConcept(concept, q) >= 55 : false;
    });
  });
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
