import type { Concept, RelationshipType } from "@/lib/knowledge/types";

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  REQUIRES: "Requires",
  PART_OF: "Part of",
  USED_BY: "Used by",
  CONTRASTS_WITH: "Contrasts with",
  EXTENDS: "Extends",
};

export const CATEGORIES = [
  "Get started",
  "Plans & versions",
  "Workforce",
  "Build & refine",
  "Collaborate",
  "Administration",
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  "Get started": "#007E45",
  "Plans & versions": "#3b82f6",
  Workforce: "#f59e0b",
  "Build & refine": "#8b5cf6",
  Collaborate: "#06b6d4",
  Administration: "#64748b",
};

export const concepts: Concept[] = [
  {
    id: "sage-planning",
    title: "Sage Planning",
    summary:
      "Cloud FP&A planning connected to Sage Intacct actuals for forecasts, scenarios, and collaboration.",
    whyItMatters:
      "Sage Planning lets finance teams build plans and forecasts without spreadsheet sprawl while staying connected to Intacct actuals and budgets.",
    keyDetails: [
      "Native connection to Sage Intacct actuals and budget repository",
      "Version control for forecasts and what-if scenarios",
      "Rolling forecasts as new actuals arrive",
      "Collaboration with share, merge, and adaptive permissions",
    ],
    relationships: [
      { targetId: "navigate-planning", type: "REQUIRES" },
      { targetId: "plans-and-versions", type: "USED_BY" },
      { targetId: "workforce-planning", type: "USED_BY" },
      { targetId: "planning-settings", type: "REQUIRES" },
    ],
    examples: [
      "Open recent plans from Home",
      "Explain Planning vs spreadsheet-only FP&A",
    ],
    tasks: ["Initiate Sage Planning", "Open a recent plan", "Find Help topics"],
    category: "Get started",
  },
  {
    id: "navigate-planning",
    title: "Navigate the application",
    summary:
      "Home, Plans, and Settings chrome for moving between plans and configuration.",
    whyItMatters:
      "Knowing the shell (Home, plan workspace, Settings) keeps Help and Ask answers tied to the screen you are on.",
    keyDetails: [
      "Home lists recent plans for the company",
      "Opening a plan routes to /plan/{id}/… SPA paths",
      "In-app Help opens beside the product",
    ],
    relationships: [
      { targetId: "sage-planning", type: "PART_OF" },
      { targetId: "plans-and-versions", type: "USED_BY" },
    ],
    category: "Get started",
  },
  {
    id: "plans-and-versions",
    title: "Plans and versions",
    summary:
      "Create and manage plans, working versions, copies, and version history.",
    whyItMatters:
      "Plans and versions are the unit of work in Planning—every forecast and scenario lives on a versioned plan.",
    keyDetails: [
      "Draft new plans from Home or Plans",
      "Versions capture forecasts and scenarios",
      "Copies support what-if exploration without overwriting the working plan",
    ],
    relationships: [
      { targetId: "sage-planning", type: "PART_OF" },
      { targetId: "forecasts", type: "USED_BY" },
      { targetId: "scenarios", type: "USED_BY" },
      { targetId: "manage-and-share", type: "USED_BY" },
    ],
    category: "Plans & versions",
  },
  {
    id: "forecasts",
    title: "Forecasts",
    summary:
      "Build forecasts on a plan version, including rolling forecasts as actuals land.",
    whyItMatters:
      "Forecasts turn static budgets into living outlooks that update with Intacct actuals.",
    keyDetails: [
      "Create a forecast after you have a plan",
      "Add actuals into the forecast cycle",
      "Support rolling forecast patterns",
    ],
    relationships: [
      { targetId: "plans-and-versions", type: "REQUIRES" },
      { targetId: "formulas-and-data", type: "REQUIRES" },
    ],
    category: "Plans & versions",
  },
  {
    id: "scenarios",
    title: "Scenarios",
    summary: "What-if scenarios to compare alternatives without losing the working plan.",
    whyItMatters:
      "Scenarios let FP&A explore upside/downside cases and merge chosen changes back deliberately.",
    keyDetails: [
      "Separate scenario versions from the working plan",
      "Compare outcomes across scenarios",
      "Merge selected changes when ready",
    ],
    relationships: [
      { targetId: "plans-and-versions", type: "REQUIRES" },
      { targetId: "manage-and-share", type: "USED_BY" },
    ],
    category: "Plans & versions",
  },
  {
    id: "workforce-planning",
    title: "Workforce planning",
    summary:
      "Plan headcount, salaries, benefits, allocations, and other employee-related costs.",
    whyItMatters:
      "Workforce is often the largest cost driver; WFP keeps people costs in the same plan as financial accounts.",
    keyDetails: [
      "Headcount and salary planning",
      "Benefits and related employee costs",
      "Workforce views under /plan/{id}/workforce",
    ],
    relationships: [
      { targetId: "plans-and-versions", type: "REQUIRES" },
      { targetId: "plan-accounts", type: "USED_BY" },
    ],
    category: "Workforce",
  },
  {
    id: "plan-accounts",
    title: "Plan accounts",
    summary:
      "Income statement and statistical accounts that structure plan lines in the workspace.",
    whyItMatters:
      "Accounts are the grid you plan against—matching Intacct structure so actuals and budgets align.",
    keyDetails: [
      "Income statement accounts path in the plan SPA",
      "Statistical accounts for non-monetary drivers",
      "Account and dimension-level permissions",
    ],
    relationships: [
      { targetId: "plans-and-versions", type: "PART_OF" },
      { targetId: "formulas-and-data", type: "USED_BY" },
    ],
    category: "Build & refine",
  },
  {
    id: "formulas-and-data",
    title: "Formulas and data",
    summary:
      "Add data, write formulas with plan-line references, and refine numbers in the plan.",
    whyItMatters:
      "Formulas and data entry are how plans become calculable models instead of static grids.",
    keyDetails: [
      "Formula editor with plan line references",
      "Populate plans from multiple data sources",
      "Merge collaborator changes into the working plan",
    ],
    relationships: [
      { targetId: "plan-accounts", type: "REQUIRES" },
      { targetId: "manage-and-share", type: "USED_BY" },
    ],
    category: "Build & refine",
  },
  {
    id: "manage-and-share",
    title: "Manage and share",
    summary:
      "Review, share versions, collect inputs, and merge changes with your team.",
    whyItMatters:
      "Planning is collaborative—share and merge keep one working plan without emailing files.",
    keyDetails: [
      "Share versions with colleagues",
      "Track changes with an audit trail",
      "Merge inputs back into the working plan",
    ],
    relationships: [
      { targetId: "plans-and-versions", type: "REQUIRES" },
      { targetId: "planning-settings", type: "REQUIRES" },
    ],
    category: "Collaborate",
  },
  {
    id: "planning-settings",
    title: "Planning settings",
    summary: "Organization setup, access, and configuration for Sage Planning.",
    whyItMatters:
      "Correct settings (permissions, dimensions, connections) keep plans secure and aligned to Intacct.",
    keyDetails: [
      "Adaptive permissions at account and dimension level",
      "Company and connection setup",
      "Settings chrome in the Planning SPA",
    ],
    relationships: [{ targetId: "sage-planning", type: "PART_OF" }],
    category: "Administration",
  },
  {
    id: "planning-glossary",
    title: "Planning glossary",
    summary: "Shared vocabulary for plans, versions, forecasts, and workforce terms.",
    whyItMatters:
      "A common glossary keeps Ask classification and Help topics aligned with how planners speak.",
    keyDetails: ["Canonical terms for Planning Help", "Useful for onboarding"],
    relationships: [{ targetId: "sage-planning", type: "PART_OF" }],
    category: "Get started",
  },
];
