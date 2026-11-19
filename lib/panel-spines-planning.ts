/**
 * Screen spines for in-Planning Smart Help Guide (SPA path-based).
 */
import { SAGE_HELP_BASE_URL } from "@/packs/sage-planning/help-links";
import type { PanelScreenSpine } from "@/lib/panel-spines";

const H = SAGE_HELP_BASE_URL;

export const PLANNING_DEMO_SPINE: PanelScreenSpine[] = [
  {
    id: "planning-home",
    match: /welcome to sage planning|recent plans|^planning$/i,
    module: "Home",
    conceptIds: ["sage-planning", "navigate-planning", "plans-and-versions"],
    skillPathId: "planning-get-started",
    helpUrl: `${H}/overview.htm`,
    suggestedQuery: "What is Sage Planning and where do I start?",
    highlightLabels: ["Home", "Plans", "Settings"],
    guideSteps: [
      {
        title: "You are on Planning Home",
        detail:
          "Recent plans for your company appear here. Open one to enter the plan workspace.",
      },
      {
        title: "Open Sage Planning Help",
        detail:
          "Use Open Help topic for What is Sage Planning? and quickstart guides.",
      },
      {
        title: "Ask a Planning question",
        detail:
          "Switch to Ask for cited steps from Planning Help (not Intacct Help).",
      },
    ],
  },
  {
    id: "planning-accounts",
    match: /income statement|statistical|accounts/i,
    module: "Accounts",
    conceptIds: ["plan-accounts", "formulas-and-data", "plans-and-versions"],
    skillPathId: "create-forecast",
    helpUrl: `${H}/overview.htm`,
    suggestedQuery: "How do I work with plan accounts and formulas in Sage Planning?",
    highlightLabels: ["Accounts", "Income statement"],
    guideSteps: [
      {
        title: "Plan accounts workspace",
        detail:
          "Income statement and statistical accounts structure the lines you plan against.",
      },
      {
        title: "Formulas and data",
        detail:
          "Use formulas with plan-line references and bring data into the plan.",
      },
    ],
  },
  {
    id: "planning-workforce",
    match: /workforce|headcount|salar/i,
    module: "Workforce",
    conceptIds: ["workforce-planning", "plans-and-versions"],
    skillPathId: "workforce-plan",
    helpUrl: `${H}/overview.htm`,
    suggestedQuery: "What is workforce planning in Sage Planning?",
    highlightLabels: ["Workforce"],
    guideSteps: [
      {
        title: "Workforce planning",
        detail:
          "Plan headcount, salaries, benefits, and related employee costs on this plan.",
      },
    ],
  },
  {
    id: "planning-plan",
    match: /\/plan\//i,
    module: "Plans",
    conceptIds: ["plans-and-versions", "forecasts", "scenarios"],
    skillPathId: "create-forecast",
    helpUrl: `${H}/quickstart-guides.htm`,
    suggestedQuery: "How do I create a forecast in Sage Planning?",
    highlightLabels: ["Plans", "Versions"],
    guideSteps: [
      {
        title: "Inside a plan",
        detail:
          "This SPA route is a plan workspace. Accounts and Workforce live under this plan id.",
      },
      {
        title: "Versions and forecasts",
        detail:
          "Create versions for forecasts and scenarios without losing the working plan.",
      },
    ],
  },
  {
    id: "planning-settings",
    match: /settings|adjust settings/i,
    module: "Settings",
    conceptIds: ["planning-settings", "manage-and-share"],
    skillPathId: "planning-get-started",
    helpUrl: `${H}/overview.htm`,
    suggestedQuery: "How do I adjust settings in Sage Planning?",
    highlightLabels: ["Settings"],
    guideSteps: [
      {
        title: "Planning settings",
        detail:
          "Configure organization setup, permissions, and connections for Planning.",
      },
    ],
  },
];
