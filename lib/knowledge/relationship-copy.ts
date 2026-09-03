import type { RelatedConcept, RelationshipType } from "./types";
import { getRelatedDetailed } from "./relations";
import type { ContentPack } from "./types";

export function relationshipSentence(
  sourceTitle: string,
  type: RelationshipType,
  targetTitle: string,
  direction: "outgoing" | "incoming"
): string {
  const a = direction === "outgoing" ? sourceTitle : targetTitle;
  const b = direction === "outgoing" ? targetTitle : sourceTitle;
  switch (type) {
    case "REQUIRES":
      return `${a} requires ${b}`;
    case "PART_OF":
      return `${a} is part of ${b}`;
    case "USED_BY":
      return `${a} is used by ${b}`;
    case "CONTRASTS_WITH":
      return `${a} contrasts with ${b}`;
    case "EXTENDS":
      return `${a} extends ${b}`;
    default:
      return `${a} relates to ${b}`;
  }
}

export type RelationGroupKey =
  | "learn-first"
  | "part-of"
  | "used-with"
  | "enables"
  | "related";

export const RELATION_GROUP_LABELS: Record<RelationGroupKey, string> = {
  "learn-first": "Learn first",
  "part-of": "Part of",
  "used-with": "Used with",
  enables: "Enables",
  related: "Related workflows",
};

function groupKey(rel: RelatedConcept): RelationGroupKey {
  if (rel.type === "REQUIRES" && rel.direction === "outgoing") return "learn-first";
  if (rel.type === "REQUIRES" && rel.direction === "incoming") return "enables";
  if (rel.type === "PART_OF") return "part-of";
  if (rel.type === "USED_BY") return "used-with";
  return "related";
}

export function groupedRelationships(
  pack: ContentPack,
  conceptId: string,
  limit = 6
): Array<{ key: RelationGroupKey; label: string; items: RelatedConcept[] }> {
  const current = pack.concepts.find((c) => c.id === conceptId);
  if (!current) return [];
  const related = getRelatedDetailed(pack, conceptId);
  const buckets = new Map<RelationGroupKey, RelatedConcept[]>();
  for (const rel of related) {
    const key = groupKey(rel);
    const list = buckets.get(key) ?? [];
    if (list.some((item) => item.concept.id === rel.concept.id && item.type === rel.type)) {
      continue;
    }
    list.push(rel);
    buckets.set(key, list);
  }
  const order: RelationGroupKey[] = [
    "learn-first",
    "part-of",
    "used-with",
    "enables",
    "related",
  ];
  const groups = order
    .map((key) => ({
      key,
      label: RELATION_GROUP_LABELS[key],
      items: buckets.get(key) ?? [],
    }))
    .filter((g) => g.items.length > 0);

  let remaining = limit;
  return groups
    .map((group) => {
      const items = group.items.slice(0, Math.max(0, remaining));
      remaining -= items.length;
      return { ...group, items };
    })
    .filter((g) => g.items.length > 0);
}

export function sentenceFor(
  pack: ContentPack,
  conceptId: string,
  rel: RelatedConcept
): string {
  const current = pack.concepts.find((c) => c.id === conceptId);
  if (!current) return rel.concept.title;
  return relationshipSentence(
    current.title,
    rel.type,
    rel.concept.title,
    rel.direction
  );
}
