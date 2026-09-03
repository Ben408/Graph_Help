import { getActivePack } from "./active-pack";
import { classifyIntent } from "./intent";
import {
  getConceptById as getConceptByIdFromPack,
  getRelatedConcepts as getRelatedFromPack,
  getRelatedDetailed,
  pathsForConcept,
  pathsForConcepts,
} from "./relations";
import { searchConceptHits, searchConcepts as searchPackConcepts } from "./search";
import type { Concept, ContentPack, IntentResult, SkillPath } from "./types";

export function getPack(): ContentPack {
  return getActivePack();
}

export const pack = getActivePack();

export function getConceptById(id: string): Concept | undefined {
  return getConceptByIdFromPack(getActivePack(), id);
}

export function getRelatedConcepts(conceptId: string): Concept[] {
  return getRelatedFromPack(getActivePack(), conceptId);
}

export function searchConcepts(query: string): Concept[] {
  return searchPackConcepts(getActivePack(), query);
}

export function getConceptsByCategory(category: string): Concept[] {
  return getActivePack().concepts.filter((c) => c.category === category);
}

export function getSkillPaths(): SkillPath[] {
  return getActivePack().skillPaths;
}

export function getSkillPathById(id: string): SkillPath | undefined {
  return getActivePack().skillPaths.find((p) => p.id === id);
}

export function getPathsForConcept(conceptId: string): SkillPath[] {
  return pathsForConcept(getActivePack(), conceptId);
}

export function getPathsForConcepts(conceptIds: string[]): SkillPath[] {
  return pathsForConcepts(getActivePack(), conceptIds);
}

export function routeQuery(query: string): IntentResult {
  return classifyIntent(getActivePack(), query);
}

export function rankedConceptSearch(query: string) {
  return searchConceptHits(getActivePack(), query);
}

export function relatedDetailed(conceptId: string) {
  return getRelatedDetailed(getActivePack(), conceptId);
}

export {
  getRelatedDetailed,
  pathsForConcept,
  pathsForConcepts,
};
