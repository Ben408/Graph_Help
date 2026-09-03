export type RelationshipType =
  | "REQUIRES"
  | "PART_OF"
  | "USED_BY"
  | "CONTRASTS_WITH"
  | "EXTENDS";

export type QueryIntent = "concept" | "skill" | "goal";

export type ProcedureKind =
  | "HelpTopic"
  | "Procedure"
  | "UIScreen"
  | "HelpSection";

export interface Relationship {
  targetId: string;
  type: RelationshipType;
  label?: string;
  incoming?: boolean;
}

export interface HelpHierarchy {
  parent: string;
  breadcrumb: string[];
}

export interface Concept {
  id: string;
  title: string;
  summary: string;
  whyItMatters: string;
  keyDetails: string[];
  relationships: Relationship[];
  examples?: string[];
  tasks?: string[];
  category: string;
  helpUrl?: string;
  hierarchy?: HelpHierarchy;
  aliases?: string[];
}

export interface VocabularyNoun {
  id: string;
  title: string;
  aliases: string[];
  category: string;
}

export interface SkillPathStep {
  conceptId: string;
  rationale: string;
  practiceQuery?: string;
  practiceOutcome?: string;
  moduleHints?: string[];
}

export interface SkillPath {
  id: string;
  title: string;
  summary: string;
  audience: string;
  goal: string;
  estimatedMinutes?: number;
  difficulty?: "introductory" | "intermediate" | "advanced";
  completionCriteria?: string;
  steps: SkillPathStep[];
}

export interface CorpusBinding {
  startUrl: string;
  allowedPrefix: string;
  helpSearchUrl: string;
  locale: string;
  citationAllowlist: string[];
}

export interface ModuleConceptMap {
  module: string;
  urlIncludes: string[];
  conceptIds: string[];
}

export interface ContentPack {
  id: string;
  name: string;
  locale: string;
  categories: readonly string[];
  categoryColors: Record<string, string>;
  relationshipLabels: Record<RelationshipType, string>;
  corpus: CorpusBinding;
  concepts: Concept[];
  skillPaths: SkillPath[];
  moduleMap: ModuleConceptMap[];
}

export interface ConceptHit {
  concept: Concept;
  score: number;
}

export interface RelatedConcept {
  concept: Concept;
  type: RelationshipType;
  direction: "outgoing" | "incoming";
}

export interface IntentResult {
  intent: QueryIntent;
  query: string;
  conceptHits: ConceptHit[];
  skillPathHits: SkillPath[];
  vocabularyIds: string[];
}

export interface PracticeProcedure {
  id: string;
  type: ProcedureKind | string;
  title: string;
  pageUrl: string;
  headingPath?: string;
  conceptIds: string[];
}
