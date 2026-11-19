import type { CorpusBinding, ModuleConceptMap } from "@/lib/knowledge/types";

export const HELP_BASE_URL = "https://help.intacct-planning.com/core/Topics";

export const HELP_SEARCH_URL =
  "https://help.intacct-planning.com/core/Search.htm?q=";

export const RELEASE_NOTES_URL =
  "https://help.intacct-planning.com/core/Topics/whats-new.htm";

export const corpus: CorpusBinding = {
  startUrl: "https://help.intacct-planning.com/core/Topics/overview.htm",
  allowedPrefix: "https://help.intacct-planning.com/core/",
  helpSearchUrl: HELP_SEARCH_URL,
  locale: "en_US",
  citationAllowlist: [
    "https://help.intacct-planning.com/",
    "http://help.intacct-planning.com/",
  ],
  pathMarker: "/core/Topics/",
};

/** App SPA path fragments + Help topic folders → concept ids. */
export const moduleMap: ModuleConceptMap[] = [
  {
    module: "Home",
    urlIncludes: ["/", "/Topics/overview", "/Topics/quickstart", "/Topics/explore-planning"],
    conceptIds: ["sage-planning", "navigate-planning"],
  },
  {
    module: "Plans",
    urlIncludes: ["/plan/", "/Topics/create", "forecast", "version", "scenario"],
    conceptIds: ["plans-and-versions", "forecasts", "scenarios"],
  },
  {
    module: "Accounts",
    urlIncludes: ["/accounts", "income-statement", "statistical", "formula"],
    conceptIds: ["plan-accounts", "formulas-and-data"],
  },
  {
    module: "Workforce",
    urlIncludes: ["/workforce", "workforce"],
    conceptIds: ["workforce-planning"],
  },
  {
    module: "Collaborate",
    urlIncludes: ["share", "merge", "manage"],
    conceptIds: ["manage-and-share"],
  },
  {
    module: "Settings",
    urlIncludes: ["/settings", "Topics/", "adjust"],
    conceptIds: ["planning-settings"],
  },
];
