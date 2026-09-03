export type {
  Concept,
  HelpHierarchy,
  Relationship,
  RelationshipType,
} from "@/lib/knowledge/types";
export {
  getConceptById,
  getConceptsByCategory,
  getRelatedConcepts,
  searchConcepts,
} from "@/lib/knowledge";
export {
  CATEGORIES,
  CATEGORY_COLORS,
  RELATIONSHIP_LABELS,
} from "@/packs/sage-intacct/pack";
export {
  buildSageSearchUrl,
  getHelpLinkData,
  SAGE_HELP_SEARCH_URL,
} from "@/packs/sage-intacct/help-links";

import { getActivePack } from "@/lib/knowledge";

export const concepts = getActivePack().concepts;
