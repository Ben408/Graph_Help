import type { HelpHierarchy } from "@/lib/knowledge/types";
import { HELP_BASE_URL, HELP_SEARCH_URL } from "./corpus";

export const SAGE_HELP_BASE_URL = HELP_BASE_URL;
export const SAGE_HELP_SEARCH_URL = HELP_SEARCH_URL;

type HelpLink = {
  helpUrl: string;
  hierarchy: HelpHierarchy;
};

export const helpLinks: Record<string, HelpLink> = {
  "sage-planning": {
    helpUrl: `${HELP_BASE_URL}/overview.htm`,
    hierarchy: { parent: "Get started", breadcrumb: ["Get started", "What is Sage Planning?"] },
  },
  "navigate-planning": {
    helpUrl: `${HELP_BASE_URL}/explore-planning.htm`,
    hierarchy: {
      parent: "Get started",
      breadcrumb: ["Get started", "Navigate the application"],
    },
  },
  "plans-and-versions": {
    helpUrl: `${HELP_BASE_URL}/quickstart-guides.htm`,
    hierarchy: {
      parent: "Create plans and versions",
      breadcrumb: ["Create plans and versions"],
    },
  },
  forecasts: {
    helpUrl: `${HELP_BASE_URL}/quickstart-guides.htm`,
    hierarchy: {
      parent: "Create plans and versions",
      breadcrumb: ["Create plans and versions", "Forecasts"],
    },
  },
  scenarios: {
    helpUrl: `${HELP_BASE_URL}/quickstart-guides.htm`,
    hierarchy: {
      parent: "Create plans and versions",
      breadcrumb: ["Create plans and versions", "Scenarios"],
    },
  },
  "workforce-planning": {
    helpUrl: `${HELP_BASE_URL}/overview.htm`,
    hierarchy: {
      parent: "Plan workforce",
      breadcrumb: ["Plan workforce"],
    },
  },
  "plan-accounts": {
    helpUrl: `${HELP_BASE_URL}/overview.htm`,
    hierarchy: {
      parent: "Build and refine",
      breadcrumb: ["Build and refine", "Accounts"],
    },
  },
  "formulas-and-data": {
    helpUrl: `${HELP_BASE_URL}/overview.htm`,
    hierarchy: {
      parent: "Build and refine",
      breadcrumb: ["Build and refine", "Formulas and data"],
    },
  },
  "manage-and-share": {
    helpUrl: `${HELP_BASE_URL}/overview.htm`,
    hierarchy: {
      parent: "Manage and share",
      breadcrumb: ["Manage and share"],
    },
  },
  "planning-settings": {
    helpUrl: `${HELP_BASE_URL}/overview.htm`,
    hierarchy: {
      parent: "Adjust settings",
      breadcrumb: ["Adjust settings"],
    },
  },
  "planning-glossary": {
    helpUrl: `${HELP_BASE_URL}/planning-glossary.htm`,
    hierarchy: {
      parent: "Get started",
      breadcrumb: ["Get started", "Planning glossary"],
    },
  },
};

export function getHelpLinkData(conceptId: string): HelpLink | undefined {
  return helpLinks[conceptId];
}

export function buildSageSearchUrl(query: string): string {
  return `${SAGE_HELP_SEARCH_URL}${encodeURIComponent(query)}`;
}
