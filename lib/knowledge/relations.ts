import type { Concept, ContentPack, RelatedConcept, RelationshipType } from "./types";

export function getConceptById(pack: ContentPack, id: string): Concept | undefined {
  return pack.concepts.find((c) => c.id === id);
}

export function getRelatedDetailed(pack: ContentPack, conceptId: string): RelatedConcept[] {
  const current = getConceptById(pack, conceptId);
  if (!current) return [];
  const seen = new Set<string>();
  const out: RelatedConcept[] = [];

  for (const rel of current.relationships) {
    const concept = getConceptById(pack, rel.targetId);
    if (!concept) continue;
    const key = `${concept.id}:${rel.type}:outgoing`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ concept, type: rel.type, direction: "outgoing" });
  }

  for (const other of pack.concepts) {
    if (other.id === conceptId) continue;
    for (const rel of other.relationships) {
      if (rel.targetId !== conceptId) continue;
      const key = `${other.id}:${rel.type}:incoming`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ concept: other, type: rel.type, direction: "incoming" });
    }
  }

  return out;
}

export function getRelatedConcepts(pack: ContentPack, conceptId: string): Concept[] {
  const seen = new Set<string>();
  const related: Concept[] = [];
  for (const item of getRelatedDetailed(pack, conceptId)) {
    if (seen.has(item.concept.id)) continue;
    seen.add(item.concept.id);
    related.push(item.concept);
  }
  return related;
}

export function incomingRelationships(
  pack: ContentPack,
  conceptId: string
): Array<{ sourceId: string; type: RelationshipType }> {
  const edges: Array<{ sourceId: string; type: RelationshipType }> = [];
  for (const other of pack.concepts) {
    for (const rel of other.relationships) {
      if (rel.targetId === conceptId) {
        edges.push({ sourceId: other.id, type: rel.type });
      }
    }
  }
  return edges;
}

export function pathsForConcept(pack: ContentPack, conceptId: string) {
  return pack.skillPaths.filter((path) =>
    path.steps.some((step) => step.conceptId === conceptId)
  );
}

export function pathsForConcepts(pack: ContentPack, conceptIds: string[]) {
  const set = new Set(conceptIds);
  return pack.skillPaths.filter((path) =>
    path.steps.some((step) => set.has(step.conceptId))
  );
}
