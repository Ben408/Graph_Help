import type { Concept, ContentPack } from "@/lib/knowledge/types";
import { CONCEPT_ALIASES } from "./aliases";
import {
  CATEGORIES,
  CATEGORY_COLORS,
  concepts as authoredConcepts,
  RELATIONSHIP_LABELS,
} from "./concepts";
import { corpus, moduleMap } from "./corpus";
import generatedConcepts from "./concepts.generated.json";
import { helpLinks } from "./help-links";
import { skillPaths } from "./skill-paths";

type GeneratedConcept = {
  id: string;
  summary?: string;
  whyItMatters?: string;
  keyDetails?: string[];
};

const generatedById = new Map(
  ((generatedConcepts as { concepts?: GeneratedConcept[] }).concepts ?? []).map(
    (item) => [item.id, item]
  )
);

function hydrateConcept(concept: Concept): Concept {
  const help = helpLinks[concept.id];
  const generated = generatedById.get(concept.id);
  const keyDetails =
    generated?.keyDetails && generated.keyDetails.length >= 3
      ? generated.keyDetails
      : concept.keyDetails;
  return {
    ...concept,
    summary: generated?.summary || concept.summary,
    whyItMatters: generated?.whyItMatters || concept.whyItMatters,
    keyDetails,
    aliases: CONCEPT_ALIASES[concept.id] ?? [],
    helpUrl: help?.helpUrl ?? concept.helpUrl,
    hierarchy: help?.hierarchy ?? concept.hierarchy,
  };
}

export const sageIntacctPack: ContentPack = {
  id: "sage-intacct",
  name: "Sage Intacct",
  locale: corpus.locale,
  categories: CATEGORIES,
  categoryColors: CATEGORY_COLORS,
  relationshipLabels: RELATIONSHIP_LABELS,
  corpus,
  concepts: authoredConcepts.map(hydrateConcept),
  skillPaths,
  moduleMap,
};

export { CATEGORIES, CATEGORY_COLORS, RELATIONSHIP_LABELS };
