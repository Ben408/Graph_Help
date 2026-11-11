import { highlights, type ReleaseHighlight } from "@/data/release-notes";
import { buildSageSearchUrl } from "@/packs/sage-intacct/help-links";
import { getActivePack } from "./active-pack";
import { classifyIntent } from "./intent";
import { significantTokens } from "./search";
import type { Concept, SkillPath } from "./types";

export type TaskHit = {
  conceptId: string;
  conceptTitle: string;
  task: string;
};

export type GlobalSearchResult = {
  query: string;
  intent: "concept" | "skill" | "goal";
  answers: boolean;
  tasks: TaskHit[];
  concepts: Concept[];
  paths: SkillPath[];
  docsQuery: string;
  docsUrl: string;
  updates: ReleaseHighlight[];
};

export function searchTasks(query: string, limit = 8): TaskHit[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const tokens = significantTokens(q);
  const hits: TaskHit[] = [];
  for (const concept of getActivePack().concepts) {
    for (const task of concept.tasks ?? []) {
      const blob = `${task} ${concept.title}`.toLowerCase();
      const fullHit = blob.includes(q);
      const tokenHit =
        tokens.length > 0 && tokens.every((part) => blob.includes(part));
      if (fullHit || tokenHit) {
        hits.push({ conceptId: concept.id, conceptTitle: concept.title, task });
      }
    }
  }
  return hits.slice(0, limit);
}

export function searchUpdates(query: string, limit = 6): ReleaseHighlight[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  return highlights
    .filter((item) =>
      [item.title, item.description, item.area, ...(item.regions ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(q)
    )
    .slice(0, limit);
}

export function globalSearch(query: string): GlobalSearchResult {
  const q = query.trim();
  const pack = getActivePack();
  const routed = q.length >= 2 ? classifyIntent(pack, q) : null;
  const looksGoal = routed?.intent === "goal";
  return {
    query: q,
    intent: routed?.intent ?? "concept",
    answers: Boolean(
      looksGoal || /^(how|can i|steps?|what (is|are)|explain)\b/i.test(q)
    ),
    tasks: searchTasks(q),
    concepts: (routed?.conceptHits ?? []).slice(0, 9).map((h) => h.concept),
    paths: routed?.skillPathHits ?? [],
    docsQuery: q,
    docsUrl: q.length >= 2 ? buildSageSearchUrl(q) : pack.corpus.helpSearchUrl,
    updates: searchUpdates(q),
  };
}

export function recentUpdates(limit = 5): ReleaseHighlight[] {
  return highlights.slice(0, limit);
}
