import { matchSkillPaths, searchConceptHits, vocabularyIdsForQuery } from "./search";
import type { ContentPack, IntentResult, QueryIntent } from "./types";

const GOAL_RE =
  /\b(how (do i|to|can i|does one)|steps? to|walk me through|help me|close my books|close the books|reverse a|post a|configure|set up|troubleshoot)\b/i;

const SKILL_RE =
  /\b(learn|skill path|curriculum|get better at|master|onboard|practice|path to)\b/i;

export function classifyIntent(pack: ContentPack, query: string): IntentResult {
  const q = query.trim();
  const conceptHits = searchConceptHits(pack, q);
  const skillPathHits = matchSkillPaths(pack, q);
  const vocabularyIds = vocabularyIdsForQuery(pack, q);
  const top = conceptHits[0];
  const looksGoal = GOAL_RE.test(q);
  const looksSkill = SKILL_RE.test(q);

  let intent: QueryIntent = "concept";
  if (looksGoal && !(top && top.score >= 80 && q.split(/\s+/).length <= 3)) {
    intent = "goal";
  } else if (looksSkill || (skillPathHits.length > 0 && (!top || top.score < 55))) {
    intent = "skill";
  } else if (!top && looksGoal) {
    intent = "goal";
  }

  return {
    intent,
    query: q,
    conceptHits,
    skillPathHits,
    vocabularyIds,
  };
}
