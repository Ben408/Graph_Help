import type { CorpusBinding, ModuleConceptMap } from "@/lib/knowledge/types";

export const HELP_BASE_URL =
  "https://www.intacct.com/ia/docs/en_US/help_action";

export const HELP_SEARCH_URL =
  "https://www.intacct.com/ia/docs/en_US/help_action/Default.htm#t=Search%2FSearch.htm&rhsearch=";

export const RELEASE_NOTES_URL =
  "https://www.intacct.com/ia/docs/en_US/releasenotes";

export const corpus: CorpusBinding = {
  startUrl:
    "https://www.intacct.com/ia/docs/en_US/help_action/Intacct_basics/welcome.htm",
  allowedPrefix: "https://www.intacct.com/ia/docs/en_US/help_action/",
  helpSearchUrl: HELP_SEARCH_URL,
  locale: "en_US",
  citationAllowlist: [
    "https://www.intacct.com/ia/docs/",
    "http://www.intacct.com/ia/docs/",
  ],
};

export const moduleMap: ModuleConceptMap[] = [
  {
    module: "General_Ledger",
    urlIncludes: ["/General_Ledger/"],
    conceptIds: [
      "general-ledger",
      "chart-of-accounts",
      "journal-entries",
      "budgets",
      "allocations",
      "close-books",
    ],
  },
  {
    module: "Company",
    urlIncludes: ["/Company/Dimensions/"],
    conceptIds: ["dimensions"],
  },
  {
    module: "Accounts_Payable",
    urlIncludes: ["/Accounts_Payable/"],
    conceptIds: [
      "accounts-payable",
      "vendors",
      "vendor-payments",
      "ap-automation",
    ],
  },
  {
    module: "Purchasing",
    urlIncludes: ["/Purchasing/"],
    conceptIds: ["purchasing"],
  },
  {
    module: "Accounts_Receivable",
    urlIncludes: ["/Accounts_Receivable/"],
    conceptIds: ["accounts-receivable"],
  },
  {
    module: "Order_Entry",
    urlIncludes: ["/Order_Entry/"],
    conceptIds: ["order-entry"],
  },
  {
    module: "Cash_Management",
    urlIncludes: ["/Cash_Management/"],
    conceptIds: ["cash-management", "bank-reconciliation"],
  },
  {
    module: "Reporting",
    urlIncludes: ["/Reporting/"],
    conceptIds: ["financial-reporting", "dashboards", "reporting-periods"],
  },
  {
    module: "Consolidation",
    urlIncludes: ["/Consolidation/", "/Multi-entity/", "/Multi-currency/"],
    conceptIds: ["consolidation", "multi-entity", "multi-currency"],
  },
  {
    module: "Contracts",
    urlIncludes: ["/Contracts/", "/Revenue_Recognition/"],
    conceptIds: ["contracts", "revenue-recognition"],
  },
  {
    module: "Copilot",
    urlIncludes: ["/Copilot/", "/Sage_Copilot/"],
    conceptIds: ["sage-copilot", "sage-ai", "close-workspace"],
  },
  {
    module: "Platform_Services",
    urlIncludes: ["/Platform_Services/"],
    conceptIds: ["platform-services", "smart-events"],
  },
];
