/**
 * Screen → pack concept map for in-product Smart Help panels.
 * Intacct: Frameset/ifmod + DEMO_SPINE. Planning: SPA paths + PLANNING_DEMO_SPINE.
 */

import { getHelpLinkData as getIntacctHelp } from "@/packs/sage-intacct/help-links";
import { getHelpLinkData as getPlanningHelp } from "@/packs/sage-planning/help-links";
import {
  detectPackIdFromUrl,
  isPackId,
  resolvePackId,
  type PackId,
} from "@/lib/knowledge/product-detect";
import { getPackById } from "@/lib/knowledge/pack-registry";
import {
  DEMO_SPINE,
  MODULE_SKILL_PATHS,
  buildGenericGuideSteps,
  buildModuleGuideSteps,
  type PanelScreenSpine,
} from "@/lib/panel-spines";
import { PLANNING_DEMO_SPINE } from "@/lib/panel-spines-planning";

export type PanelMode = "help" | "guide" | "context";
export type { PanelScreenSpine };
export { DEMO_SPINE };

export type ResolvedPanelContext = {
  mode: PanelMode;
  packId: PackId;
  packName: string;
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
  mapped: boolean;
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

/** Coarse module → concept ids (Intacct). */
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
  Home: ["sage-planning", "navigate-planning"],
  Plans: ["plans-and-versions", "forecasts", "scenarios"],
  Accounts: ["plan-accounts", "formulas-and-data"],
  Workforce: ["workforce-planning"],
  Settings: ["planning-settings"],
};

export function moduleFromIfmod(ifmod: string | null | undefined): string {
  if (!ifmod) return "";
  return MODULE_BY_IFMOD[ifmod.toLowerCase()] || "";
}

function spinesForPack(packId: PackId): PanelScreenSpine[] {
  return packId === "sage-planning" ? PLANNING_DEMO_SPINE : DEMO_SPINE;
}

function helpForConcept(packId: PackId, conceptId: string): string {
  if (packId === "sage-planning") {
    return getPlanningHelp(conceptId)?.helpUrl || "";
  }
  return getIntacctHelp(conceptId)?.helpUrl || "";
}

export function matchSpine(
  title: string,
  screen: string,
  packId: PackId = "sage-intacct",
  pagePath?: string
): PanelScreenSpine | null {
  const blob = `${title} ${screen} ${pagePath || ""}`.trim();
  if (!blob) return null;
  for (const spine of spinesForPack(packId)) {
    if (spine.match.test(blob)) return spine;
  }
  return null;
}

/** True when the URL points at product Help docs (not an app screen). */
export function isSageHelpUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host.includes("help.intacct-planning.com")) return true;
    if (
      host.endsWith("intacct.com") &&
      !host.includes("intacct-planning") &&
      (/\/ia\/docs\//i.test(u.pathname) ||
        /help_action/i.test(u.pathname + u.href))
    ) {
      return true;
    }
    return false;
  } catch {
    return /help\.intacct-planning\.com|\/ia\/docs\/|help_action/i.test(url);
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
  const pageUrl = get("page_url") || get("pageUrl") || "";
  const packParam = get("pack");
  let helpUrl = get("help_url") || get("helpUrl");
  if (!isSageHelpUrl(helpUrl)) helpUrl = "";
  const q = get("q");
  const conceptParam = get("concept");
  const pathParam = get("path");
  const focus = get("focus");

  const packId = resolvePackId({
    packId: isPackId(packParam) ? packParam : null,
    pageUrl: pageUrl || null,
    helpUrl: helpUrl || null,
  });
  // Prefer explicit page host over stale pack= when both disagree.
  const fromPage = detectPackIdFromUrl(pageUrl);
  const resolvedPack: PackId = fromPage || packId;
  const pack = getPackById(resolvedPack);

  const module = moduleParam || moduleFromIfmod(ifmod);
  let pagePath = "";
  try {
    if (pageUrl) pagePath = new URL(pageUrl).pathname;
  } catch {
    pagePath = pageUrl;
  }
  const spine = matchSpine(title, screen, resolvedPack, pagePath);

  let conceptIds: string[] = [];
  let skillPathId: string | null = pathParam || null;
  let suggestedQuery = q;
  let highlightLabels: string[] = [];
  let guideSteps: ResolvedPanelContext["guideSteps"] = [];
  let mapped = false;
  let moduleOnly = false;
  const productName = pack.name;

  if (spine) {
    mapped = true;
    conceptIds = [...spine.conceptIds];
    skillPathId = skillPathId || spine.skillPathId || null;
    suggestedQuery = suggestedQuery || spine.suggestedQuery || "";
    highlightLabels = spine.highlightLabels || [];
    guideSteps = spine.guideSteps || [];
    if (spine.helpUrl) helpUrl = spine.helpUrl;
  } else if (module && MODULE_CONCEPTS[module]) {
    moduleOnly = true;
    conceptIds = [...MODULE_CONCEPTS[module]];
    skillPathId = skillPathId || MODULE_SKILL_PATHS[module] || null;
    suggestedQuery =
      suggestedQuery ||
      `How do I use ${screen || module.replace(/_/g, " ")} in ${productName}?`;
    guideSteps = buildModuleGuideSteps(module, screen || title);
    if (!helpUrl && conceptIds[0]) {
      helpUrl = helpForConcept(resolvedPack, conceptIds[0]);
    }
  } else {
    suggestedQuery =
      suggestedQuery ||
      (screen || title
        ? `How do I use ${screen || title} in ${productName}?`
        : `How do I get help on this ${productName} screen?`);
    guideSteps = buildGenericGuideSteps(screen, title);
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

  if (!helpUrl && conceptIds[0]) {
    helpUrl = helpForConcept(resolvedPack, conceptIds[0]);
  }

  let mode: PanelMode = "guide";
  if (modeRaw === "guide" || modeRaw === "context" || modeRaw === "help") {
    mode = modeRaw;
  }

  return {
    mode,
    packId: resolvedPack,
    packName: productName,
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
