/**
 * Screen → pack concept map for the in-Intacct panel.
 * Demo spine is hand-tuned; moduleMap covers coarse module bias.
 */

import { getHelpLinkData } from "@/packs/sage-intacct/help-links";
import {
  DEMO_SPINE,
  MODULE_SKILL_PATHS,
  buildGenericGuideSteps,
  buildModuleGuideSteps,
  type PanelScreenSpine,
} from "@/lib/panel-spines";

export type PanelMode = "help" | "guide" | "context";
export type { PanelScreenSpine };
export { DEMO_SPINE };

export type ResolvedPanelContext = {
  mode: PanelMode;
  title: string;
  screen: string;
  module: string;
  helpUrl: string;
  q: string;
  conceptIds: string[];
  skillPathId: string | null;
  suggestedQuery: string;
  highlightLabels: string[];
  guideSteps: { title: string; detail: string; highlight?: string }[];
  spineId: string | null;
  /** true when demo spine matched */
  mapped: boolean;
  /** module-level concepts only (no spine) */
  moduleOnly: boolean;
};

const MODULE_BY_IFMOD: Record<string, string> = {
  gl: "General_Ledger",
  ap: "Accounts_Payable",
  ar: "Accounts_Receivable",
  po: "Purchasing",
  so: "Order_Entry",
  cm: "Cash_Management",
  co: "Company",
  reportcenter: "Reporting",
};

/** Coarse module → concept ids (mirrors pack.json moduleMap). */
export const MODULE_CONCEPTS: Record<string, string[]> = {
  General_Ledger: [
    "general-ledger",
    "chart-of-accounts",
    "journal-entries",
    "budgets",
    "allocations",
    "close-books",
  ],
  Accounts_Payable: [
    "accounts-payable",
    "vendors",
    "vendor-payments",
    "ap-automation",
  ],
  Accounts_Receivable: ["accounts-receivable"],
  Purchasing: ["purchasing"],
  Order_Entry: ["order-entry"],
  Cash_Management: ["cash-management", "bank-reconciliation"],
  Company: ["dimensions"],
  Reporting: ["financial-reporting", "dashboards", "reporting-periods"],
  Consolidation: ["consolidation", "multi-entity", "multi-currency"],
};

export function moduleFromIfmod(ifmod: string | null | undefined): string {
  if (!ifmod) return "";
  return MODULE_BY_IFMOD[ifmod.toLowerCase()] || "";
}

export function matchSpine(
  title: string,
  screen: string
): PanelScreenSpine | null {
  const blob = `${title} ${screen}`.trim();
  if (!blob) return null;
  for (const spine of DEMO_SPINE) {
    if (spine.match.test(blob)) return spine;
  }
  return null;
}

/** True when the URL points at Sage Help docs (not an Intacct app screen). */
export function isSageHelpUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return (
      /intacct\.com$/i.test(u.hostname) &&
      (/\/ia\/docs\//i.test(u.pathname) ||
        /help_action/i.test(u.pathname + u.href))
    );
  } catch {
    return /\/ia\/docs\/|help_action/i.test(url);
  }
}

export function resolvePanelContext(
  params: URLSearchParams | Record<string, string | null | undefined>
): ResolvedPanelContext {
  const get = (key: string) => {
    if (params instanceof URLSearchParams) return params.get(key) || "";
    return (params[key] as string) || "";
  };

  const modeRaw = get("mode").toLowerCase();
  const title = get("title");
  const screen = get("screen") || title;
  const moduleParam = get("module");
  const ifmod = get("ifmod");
  let helpUrl = get("help_url") || get("helpUrl");
  // App iframe URLs were previously passed as help_url — drop those.
  if (!isSageHelpUrl(helpUrl)) helpUrl = "";
  const q = get("q");
  const conceptParam = get("concept");
  const pathParam = get("path");
  const focus = get("focus");

  const module = moduleParam || moduleFromIfmod(ifmod);
  const spine = matchSpine(title, screen);

  let conceptIds: string[] = [];
  let skillPathId: string | null = pathParam || null;
  let suggestedQuery = q;
  let highlightLabels: string[] = [];
  let guideSteps: ResolvedPanelContext["guideSteps"] = [];
  let mapped = false;
  let moduleOnly = false;

  if (spine) {
    mapped = true;
    conceptIds = [...spine.conceptIds];
    skillPathId = skillPathId || spine.skillPathId || null;
    suggestedQuery = suggestedQuery || spine.suggestedQuery || "";
    highlightLabels = spine.highlightLabels || [];
    guideSteps = spine.guideSteps || [];
    if (spine.helpUrl) helpUrl = spine.helpUrl;
    if (spine.module && !moduleParam) {
      // keep resolved module from ifmod when present; spine.module is fallback
    }
  } else if (module && MODULE_CONCEPTS[module]) {
    moduleOnly = true;
    conceptIds = [...MODULE_CONCEPTS[module]];
    skillPathId = skillPathId || MODULE_SKILL_PATHS[module] || null;
    suggestedQuery =
      suggestedQuery ||
      `How do I use ${screen || module.replace(/_/g, " ")} in Sage Intacct?`;
    guideSteps = buildModuleGuideSteps(module, screen || title);
    if (!helpUrl && conceptIds[0]) {
      helpUrl = getHelpLinkData(conceptIds[0])?.helpUrl || "";
    }
  } else {
    suggestedQuery =
      suggestedQuery ||
      (screen || title
        ? `How do I use ${screen || title} in Sage Intacct?`
        : "How do I get help on this Intacct screen?");
    guideSteps = buildGenericGuideSteps(screen, title);
    if (!helpUrl && conceptIds[0]) {
      helpUrl = getHelpLinkData(conceptIds[0])?.helpUrl || "";
    }
  }

  if (conceptParam) {
    const extra = conceptParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    conceptIds = [...new Set([...extra, ...conceptIds])];
  }
  if (focus && !conceptIds.includes(focus)) {
    conceptIds = [focus, ...conceptIds];
  }

  // Prefer Help URL from primary concept when spine/module did not supply one.
  if (!helpUrl && conceptIds[0]) {
    helpUrl = getHelpLinkData(conceptIds[0])?.helpUrl || "";
  }

  // Default to Guide for in-Intacct panel opens. Explicit mode wins;
  // a seeded q alone does not steal the tab away from Guide.
  let mode: PanelMode = "guide";
  if (modeRaw === "guide" || modeRaw === "context" || modeRaw === "help") {
    mode = modeRaw;
  }

  return {
    mode,
    title,
    screen,
    module: module || spine?.module || "",
    helpUrl,
    q,
    conceptIds,
    skillPathId,
    suggestedQuery,
    highlightLabels,
    guideSteps,
    spineId: spine?.id ?? null,
    mapped,
    moduleOnly,
  };
}
