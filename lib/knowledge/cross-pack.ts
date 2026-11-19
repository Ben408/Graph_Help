import { getActivePackId } from "./active-pack";
import { listPacks } from "./pack-registry";
import type { PackId } from "./product-detect";
import type { Concept, ContentPack, SkillPath } from "./types";

export function findPackForConceptId(
  conceptId: string,
  preferredPackId?: string | null
): ContentPack | undefined {
  const packs = listPacks();
  if (preferredPackId) {
    const preferred = packs.find((pack) => pack.id === preferredPackId);
    if (preferred?.concepts.some((concept) => concept.id === conceptId)) {
      return preferred;
    }
  }
  return packs.find((pack) =>
    pack.concepts.some((concept) => concept.id === conceptId)
  );
}

export function findPackForSkillPathId(
  pathId: string,
  preferredPackId?: string | null
): ContentPack | undefined {
  const packs = listPacks();
  if (preferredPackId) {
    const preferred = packs.find((pack) => pack.id === preferredPackId);
    if (preferred?.skillPaths.some((path) => path.id === pathId)) {
      return preferred;
    }
  }
  return packs.find((pack) =>
    pack.skillPaths.some((path) => path.id === pathId)
  );
}

export function findConceptAcrossPacks(
  conceptId: string,
  preferredPackId?: string | null
): { pack: ContentPack; concept: Concept } | undefined {
  const pack = findPackForConceptId(conceptId, preferredPackId);
  const concept = pack?.concepts.find((item) => item.id === conceptId);
  if (!pack || !concept) return undefined;
  return { pack, concept };
}

export function findSkillPathAcrossPacks(
  pathId: string,
  preferredPackId?: string | null
): { pack: ContentPack; path: SkillPath } | undefined {
  const pack = findPackForSkillPathId(pathId, preferredPackId);
  const path = pack?.skillPaths.find((item) => item.id === pathId);
  if (!pack || !path) return undefined;
  return { pack, path };
}

export function allConceptStaticParams(): Array<{ id: string }> {
  const seen = new Set<string>();
  const params: Array<{ id: string }> = [];
  for (const pack of listPacks()) {
    for (const concept of pack.concepts) {
      if (seen.has(concept.id)) continue;
      seen.add(concept.id);
      params.push({ id: concept.id });
    }
  }
  return params;
}

export function allSkillPathStaticParams(): Array<{ id: string }> {
  const seen = new Set<string>();
  const params: Array<{ id: string }> = [];
  for (const pack of listPacks()) {
    for (const path of pack.skillPaths) {
      if (seen.has(path.id)) continue;
      seen.add(path.id);
      params.push({ id: path.id });
    }
  }
  return params;
}

/** Append or replace ?pack= while preserving other query params. */
export function withPackQuery(
  href: string,
  packId?: string | null
): string {
  const id = packId || getActivePackId();
  if (!id) return href;
  const hashIndex = href.indexOf("#");
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const qIndex = withoutHash.indexOf("?");
  const path = qIndex >= 0 ? withoutHash.slice(0, qIndex) : withoutHash;
  const params = new URLSearchParams(
    qIndex >= 0 ? withoutHash.slice(qIndex + 1) : ""
  );
  params.set("pack", id);
  const qs = params.toString();
  return `${path}?${qs}${hash}`;
}

export function conceptHref(
  conceptId: string,
  packId?: string | null
): string {
  return withPackQuery(`/concept/${conceptId}`, packId);
}

export function skillPathHref(
  pathId: string,
  packId?: string | null
): string {
  return withPackQuery(`/paths/${pathId}`, packId);
}

export function packIdOrActive(packId?: string | null): PackId {
  return getActivePackId(packId);
}
