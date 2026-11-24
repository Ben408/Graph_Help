/**
 * Captured / representative Sage Copilot Search Help responses for Demo Replay mode.
 *
 * Mirrors the live `/ia/api/beta/services/core/help/search` response contract:
 * `{ id, reply, sources, additionalQuestions }`.
 *
 * Replace or append entries here with verbatim replies captured from Emerald Ridge.
 * When `SAGE_COPILOT_BEARER_TOKEN` is set on the server, `/api/copilot/ask` calls the
 * live Sage Copilot REST beta endpoint instead of using these fixtures.
 */

export type CopilotRawSource = {
  title: string;
  url: string;
  heading?: string;
  score?: number;
};

export type CopilotDemoFixture = {
  id: string;
  keywords: string[];
  reply: string;
  sources: CopilotRawSource[];
  additionalQuestions: string[];
  conceptIds?: string[];
  skillPathIds?: string[];
};

export const COPILOT_DEMO_FIXTURES: CopilotDemoFixture[] = [
  {
    id: "copilot-demo-create-vendor",
    keywords: ["create a vendor", "add vendor", "new vendor", "vendor"],
    reply:
      "To create a vendor in Sage Intacct, go to Accounts Payable > All > Vendors and select Add. Enter the required Vendor ID and Name, configure payment terms, default expense account, and 1099 settings on the Additional Information and Payment Information tabs, then select Save. If you operate in a multi-entity environment, choose whether to create the vendor at the top level (shared across entities) or within a specific entity.",
    sources: [
      {
        title: "Add a vendor",
        url: "https://www.intacct.com/ia/docs/en_US/help_action/Accounts_Payable/Vendors/add-vendor.htm",
        heading: "Accounts Payable > Vendors",
        score: 0.94,
      },
      {
        title: "Vendors overview",
        url: "https://www.intacct.com/ia/docs/en_US/help_action/Accounts_Payable/Vendors/vendors-overview.htm",
        heading: "Accounts Payable > Vendors",
        score: 0.88,
      },
    ],
    additionalQuestions: [
      "How do I update vendor payment terms?",
      "How do I set up 1099 tracking for a vendor?",
      "How do I restrict a vendor to a single entity?",
    ],
    conceptIds: ["vendor", "accounts-payable"],
    skillPathIds: ["ap-bill-to-pay"],
  },
  {
    id: "copilot-demo-ap-automation",
    keywords: ["ap automation", "automate bills", "upload bills", "ocr"],
    reply:
      "AP Automation uses AI and machine learning to capture vendor bills sent by email or uploaded to Sage Intacct, automatically creating draft bills with predicted vendor, line coding, and attachments. Users review exceptions and submit bills through your normal AP approval workflow, reducing manual data entry while preserving audit controls.",
    sources: [
      {
        title: "AP Automation overview",
        url: "https://www.intacct.com/ia/docs/en_US/help_action/Accounts_Payable/AP_Automation/ap-automation-overview.htm",
        heading: "Accounts Payable > AP Automation",
        score: 0.95,
      },
    ],
    additionalQuestions: [
      "How do I configure email ingestion for AP Automation?",
      "How do I review draft bills created by AP Automation?",
    ],
    conceptIds: ["ap-bill", "accounts-payable"],
    skillPathIds: ["ap-bill-to-pay"],
  },
  {
    id: "copilot-demo-duplicate-bills",
    keywords: ["duplicate bill", "duplicate bills", "duplicate invoice"],
    reply:
      "Sage Intacct checks for duplicate bill numbers per vendor automatically when you enter or import AP bills. You can configure whether Intacct warns or prevents saving duplicate bill numbers in Accounts Payable > Setup > Configuration under Bill numbering / duplicate detection settings.",
    sources: [
      {
        title: "Configure Accounts Payable",
        url: "https://www.intacct.com/ia/docs/en_US/help_action/Accounts_Payable/Setup/configure-ap.htm",
        heading: "Accounts Payable > Setup",
        score: 0.91,
      },
    ],
    additionalQuestions: [
      "How do I void or reverse a duplicate AP bill?",
      "How do AP bill approvals work?",
    ],
    conceptIds: ["ap-bill", "accounts-payable"],
    skillPathIds: ["ap-bill-to-pay"],
  },
  {
    id: "copilot-demo-reverse-journal",
    keywords: ["reverse a journal", "reverse journal", "reversing entry", "journal entry"],
    reply:
      "To reverse a posted journal entry, go to General Ledger > All > Journal entries, select View transactions for the journal, and open the entry you want to reverse. Select Reverse, enter the reversal date (which must be in an open period), and select Submit. Intacct posts a linked reversing entry and keeps the full audit trail intact.",
    sources: [
      {
        title: "Reverse a journal entry",
        url: "https://www.intacct.com/ia/docs/en_US/help_action/General_Ledger/Journal_entries/reverse-journal-entry.htm",
        heading: "General Ledger > Journal entries",
        score: 0.96,
      },
    ],
    additionalQuestions: [
      "When should I reclassify vs. reverse a journal entry?",
      "How do I reopen a closed period?",
    ],
    conceptIds: ["journal-entry", "general-ledger"],
    skillPathIds: ["gl-month-end-close"],
  },
  {
    id: "copilot-demo-bank-reconciliation",
    keywords: ["reconcile", "bank reconciliation", "reconciliation", "bank feed"],
    reply:
      "To reconcile a bank account, go to Cash Management > All > Reconciliation > Bank. Select the checking or savings account, enter the statement ending date and ending balance, and match cleared transactions against your bank feed or statement until the difference to reconcile reaches 0.00. Then select Reconcile to finalize.",
    sources: [
      {
        title: "Reconcile a bank account",
        url: "https://www.intacct.com/ia/docs/en_US/help_action/Cash_Management/Reconciliation/reconcile-bank-account.htm",
        heading: "Cash Management > Reconciliation",
        score: 0.95,
      },
    ],
    additionalQuestions: [
      "How do I reopen a completed bank reconciliation?",
      "How do I set up bank feeds and matching rules?",
    ],
    conceptIds: ["bank-reconciliation", "cash-management"],
    skillPathIds: ["cash-bank-reconciliation"],
  },
  {
    id: "copilot-demo-close-books",
    keywords: ["close my books", "close books", "month end", "close period", "close the books"],
    reply:
      "To close the books for a period, complete subledger reconciliations (AP, AR, Cash Management) first, then go to General Ledger > All > Books > Close. Select the entity (or top level) and the reporting period to close, then select Close. Closing prevents further posting to that period until reopened by an authorized user.",
    sources: [
      {
        title: "Close the books",
        url: "https://www.intacct.com/ia/docs/en_US/help_action/General_Ledger/Close_books/close-books.htm",
        heading: "General Ledger > Books",
        score: 0.93,
      },
    ],
    additionalQuestions: [
      "How do I close subledgers before closing the General Ledger?",
      "How do I reopen a closed period?",
    ],
    conceptIds: ["reporting-period", "general-ledger"],
    skillPathIds: ["gl-month-end-close"],
  },
];

export function matchCopilotDemoResponse(query: string): CopilotDemoFixture | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  let best: { fixture: CopilotDemoFixture; score: number } | null = null;
  for (const fixture of COPILOT_DEMO_FIXTURES) {
    let score = 0;
    for (const kw of fixture.keywords) {
      if (q.includes(kw)) {
        score += kw.length + 10;
      }
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { fixture, score };
    }
  }
  return best?.fixture ?? null;
}
