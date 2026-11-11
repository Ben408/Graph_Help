/**
 * Screen → pack concept map for the in-Intacct panel.
 * Demo spine is hand-tuned; moduleMap covers coarse module bias.
 */

export type PanelMode = "help" | "guide" | "context";

export type PanelScreenSpine = {
  id: string;
  /** Match against title / screen label (case-insensitive substring). */
  match: RegExp;
  module?: string;
  conceptIds: string[];
  skillPathId?: string;
  suggestedQuery?: string;
  /** Labels in iamain to outline during Guide mode. */
  highlightLabels?: string[];
  guideSteps?: { title: string; detail: string; highlight?: string }[];
};

/** High-quality showcase screens for Guide + seeded Help. */
export const DEMO_SPINE: PanelScreenSpine[] = [
  {
    id: "close-books",
    match: /close\s*books/i,
    module: "General_Ledger",
    conceptIds: ["close-books", "general-ledger", "reporting-periods"],
    skillPathId: "period-close",
    suggestedQuery: "How do I close my books for the period?",
    highlightLabels: [
      "Entity or entity group",
      "To the end of period",
      "Close company books from",
    ],
    guideSteps: [
      {
        title: "Open Close books",
        detail:
          "You are on General Ledger → Close books. Closing locks periods so users cannot post into ranges you already reported.",
      },
      {
        title: "Choose entity (if needed)",
        detail:
          "Use Entity or entity group when you close for one entity or a group instead of the top level.",
        highlight: "Entity or entity group",
      },
      {
        title: "Select the end period",
        detail:
          "In To the end of period, pick the last period to close. Preceding open periods close with it.",
        highlight: "To the end of period",
      },
      {
        title: "Confirm permissions",
        detail:
          "You need General Ledger: Close books permission. The period must allow close.",
      },
    ],
  },
  {
    id: "journal-entries",
    match: /journal\s*entr/i,
    module: "General_Ledger",
    conceptIds: ["journal-entries", "general-ledger"],
    skillPathId: "ledger-foundations",
    suggestedQuery: "How do I reverse a journal entry in Sage Intacct?",
    highlightLabels: ["Reverse", "Posting date", "Journal"],
    guideSteps: [
      {
        title: "Find the journal entry",
        detail: "Open the posted journal entry you need to reverse.",
      },
      {
        title: "Reverse in an open period",
        detail:
          "Use Reverse when the entry is posted, not already reversed, and the period is open.",
        highlight: "Reverse",
      },
    ],
  },
  {
    id: "ap-bills",
    match: /\bbills?\b|vendor\s*invoice/i,
    module: "Accounts_Payable",
    conceptIds: ["accounts-payable", "vendors"],
    skillPathId: "procure-to-pay",
    suggestedQuery: "How do I enter an Accounts Payable bill?",
    highlightLabels: ["Vendor", "Bill number", "Amount"],
  },
];

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
  const helpUrl = get("help_url") || get("helpUrl");
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
  } else if (module && MODULE_CONCEPTS[module]) {
    moduleOnly = true;
    conceptIds = [...MODULE_CONCEPTS[module]];
  }

  if (conceptParam) {
    const extra = conceptParam.split(",").map((s) => s.trim()).filter(Boolean);
    conceptIds = [...new Set([...extra, ...conceptIds])];
  }
  if (focus && !conceptIds.includes(focus)) {
    conceptIds = [focus, ...conceptIds];
  }

  let mode: PanelMode = "help";
  if (modeRaw === "guide" || modeRaw === "context" || modeRaw === "help") {
    mode = modeRaw;
  } else if (mapped && !q) {
    mode = "guide";
  }

  return {
    mode,
    title,
    screen,
    module,
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
