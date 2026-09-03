import type { Concept, ContentPack, RelationshipType } from "./types";
import { getRelatedDetailed } from "./relations";

export const FOUNDATION_IDS = [
  "general-ledger",
  "accounts-payable",
  "accounts-receivable",
  "cash-management",
  "financial-reporting",
  "dimensions",
  "multi-entity",
  "purchasing",
  "contracts",
  "sage-copilot",
] as const;

export function conceptDegree(pack: ContentPack, conceptId: string): number {
  return getRelatedDetailed(pack, conceptId).length;
}

export function neighborSet(
  pack: ContentPack,
  seedIds: string[],
  hops: number
): Set<string> {
  const visible = new Set(seedIds.filter(Boolean));
  let frontier = [...visible];
  for (let hop = 0; hop < hops; hop++) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const rel of getRelatedDetailed(pack, id)) {
        if (!visible.has(rel.concept.id)) {
          visible.add(rel.concept.id);
          next.push(rel.concept.id);
        }
      }
    }
    frontier = next;
  }
  return visible;
}

export function conceptsByIds(pack: ContentPack, ids: Iterable<string>): Concept[] {
  const set = new Set(ids);
  return pack.concepts.filter((c) => set.has(c.id));
}

export function edgesAmong(
  pack: ContentPack,
  ids: Set<string>,
  types?: RelationshipType[]
): Array<{ source: string; target: string; type: RelationshipType }> {
  const allow = types && types.length > 0 ? new Set(types) : null;
  const edges: Array<{ source: string; target: string; type: RelationshipType }> = [];
  const seen = new Set<string>();
  for (const concept of pack.concepts) {
    if (!ids.has(concept.id)) continue;
    for (const rel of concept.relationships) {
      if (!ids.has(rel.targetId)) continue;
      if (allow && !allow.has(rel.type)) continue;
      const key = [concept.id, rel.targetId, rel.type].join(">");
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ source: concept.id, target: rel.targetId, type: rel.type });
    }
  }
  return edges;
}
