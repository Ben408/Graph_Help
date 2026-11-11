/**
 * Screen spines for in-Intacct Smart Help Guide.
 * More-specific matchers must appear before broader ones (array order).
 */

import { SAGE_HELP_BASE_URL } from "@/packs/sage-intacct/help-links";

export type PanelScreenSpine = {
  id: string;
  /** Match against title / screen label (case-insensitive substring). */
  match: RegExp;
  module?: string;
  conceptIds: string[];
  skillPathId?: string;
  suggestedQuery?: string;
  /** Canonical Sage Help topic for this screen (when known). */
  helpUrl?: string;
  /** Labels in iamain to outline during Guide mode. */
  highlightLabels?: string[];
  guideSteps?: { title: string; detail: string; highlight?: string }[];
};

const H = SAGE_HELP_BASE_URL;

export const DEMO_SPINE: PanelScreenSpine[] = [
  {
    id: "close-books",
    match: /close\s*books/i,
    module: "General_Ledger",
    conceptIds: ["close-books", "general-ledger", "reporting-periods"],
    skillPathId: "period-close",
    suggestedQuery: "How do I close my books for the period?",
    helpUrl: `${H}/General_Ledger/Open_and_close_books/close-books.htm`,
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
        title: "Confirm and close",
        detail:
          "You need General Ledger: Close books permission. Review the range, then close when ready.",
      },
    ],
  },
  {
    id: "close-ap-subledger",
    match: /close\s*ap\s*subledger/i,
    module: "Accounts_Payable",
    conceptIds: ["accounts-payable", "close-books"],
    skillPathId: "period-close",
    suggestedQuery: "How do I close the AP subledger?",
    helpUrl: `${H}/Accounts_Payable/accounts_payable.htm`,
    highlightLabels: ["Entity or entity group", "To the end of period"],
    guideSteps: [
      {
        title: "Close AP for the period",
        detail:
          "Closing the AP subledger prevents new AP posting into periods you are locking for close.",
      },
      {
        title: "Choose entity and period",
        detail:
          "Set Entity or entity group if needed, then To the end of period for the last period to close.",
        highlight: "To the end of period",
      },
      {
        title: "Finish AP work first",
        detail:
          "Post remaining bills and payments before you close AP so expenses land in the right period.",
      },
    ],
  },
  {
    id: "close-ar-subledger",
    match: /close\s*ar\s*subledger/i,
    module: "Accounts_Receivable",
    conceptIds: ["accounts-receivable", "close-books"],
    skillPathId: "period-close",
    suggestedQuery: "How do I close the AR subledger?",
    helpUrl: `${H}/Accounts_Receivable/accounts_receivable.htm`,
    highlightLabels: ["Entity or entity group", "To the end of period"],
    guideSteps: [
      {
        title: "Close AR for the period",
        detail:
          "Closing the AR subledger locks customer invoices and receipts for periods in close.",
      },
      {
        title: "Choose entity and period",
        detail:
          "Set Entity or entity group if needed, then To the end of period.",
        highlight: "To the end of period",
      },
      {
        title: "Finish AR work first",
        detail:
          "Complete invoicing and cash application before closing AR for accurate aging.",
      },
    ],
  },
  {
    id: "close-period-cm",
    match: /close\s*period|ia\.close_period/i,
    module: "Cash_Management",
    conceptIds: ["cash-management", "bank-reconciliation", "close-books"],
    skillPathId: "period-close",
    suggestedQuery: "How do I close a Cash Management period?",
    helpUrl: `${H}/Cash_Management/cash_management.htm`,
    highlightLabels: ["Entity or entity group", "To the end of period"],
    guideSteps: [
      {
        title: "Close the CM period",
        detail:
          "This closes the Cash Management subledger through the period you select.",
      },
      {
        title: "Reconcile first",
        detail:
          "Finish bank reconciliation and clear open CM items before you close the period.",
      },
      {
        title: "Select the end period",
        detail: "Use To the end of period for the last period to include.",
        highlight: "To the end of period",
      },
    ],
  },
  {
    id: "journal-entries-list",
    match: /journal\s*entries/i,
    module: "General_Ledger",
    conceptIds: ["journal-entries", "general-ledger"],
    skillPathId: "ledger-foundations",
    suggestedQuery: "How do I find and reverse a journal entry?",
    helpUrl: `${H}/General_Ledger/Journal_entries/journal_entries_overview.htm`,
    highlightLabels: ["Add", "Reverse"],
    guideSteps: [
      {
        title: "Browse journal entries",
        detail:
          "This list shows GL journal entries. Filter or search to find the batch you need.",
      },
      {
        title: "Add a new entry",
        detail: "Use Add to create a journal entry in an open period.",
        highlight: "Add",
      },
      {
        title: "Open to reverse or edit",
        detail:
          "Open a posted entry to reverse it when the period is still open and the entry is not already reversed.",
      },
    ],
  },
  {
    id: "journal-entry-form",
    match: /journal\s*entry(?!s)/i,
    module: "General_Ledger",
    conceptIds: ["journal-entries", "general-ledger"],
    skillPathId: "ledger-foundations",
    suggestedQuery: "How do I create or reverse a journal entry in Sage Intacct?",
    helpUrl: `${H}/General_Ledger/Journal_entries/journal_entries_overview.htm`,
    highlightLabels: ["Journal", "Posting date", "Reverse"],
    guideSteps: [
      {
        title: "Start the journal entry",
        detail:
          "You are on a Journal entry. Choose the Journal and Posting date so the entry hits the right book and period.",
        highlight: "Journal",
      },
      {
        title: "Enter balanced lines",
        detail:
          "Add debits and credits with accounts and dimensions. The entry must balance before you post.",
      },
      {
        title: "Submit or reverse later",
        detail:
          "Submit/post when ready. To reverse a posted entry later, open it and use Reverse in an open period.",
        highlight: "Reverse",
      },
    ],
  },
  {
    id: "pay-bills",
    match: /pay\s*bills?/i,
    module: "Accounts_Payable",
    conceptIds: ["vendor-payments", "accounts-payable", "vendors"],
    skillPathId: "procure-to-pay",
    suggestedQuery: "How do I pay vendor bills in Sage Intacct?",
    helpUrl: `${H}/Accounts_Payable/Vendor_Payments/vendor_payments_overview.htm`,
    highlightLabels: ["Pay now", "Add to outbox", "Filter by"],
    guideSteps: [
      {
        title: "Select bills to pay",
        detail:
          "You are on Pay bills. Filter to the vendors and due dates you want, then select bills.",
        highlight: "Filter by",
      },
      {
        title: "Choose payment action",
        detail:
          "Use Add to outbox to stage payments, or Pay now when you are ready to generate the payment run.",
        highlight: "Pay now",
      },
      {
        title: "Confirm method and post",
        detail:
          "Confirm payment method (check, ACH, etc.), review totals, and complete the run so AP and cash stay in sync.",
      },
    ],
  },
  {
    id: "ap-bills-list",
    match: /\bbills\b/i,
    module: "Accounts_Payable",
    conceptIds: ["accounts-payable", "vendors"],
    skillPathId: "procure-to-pay",
    suggestedQuery: "How do I find or enter AP bills?",
    helpUrl: `${H}/Accounts_Payable/Bills/bills.htm`,
    highlightLabels: ["Add"],
    guideSteps: [
      {
        title: "Browse AP bills",
        detail:
          "This list is Accounts Payable bills. Use views and filters to find drafts, posted, or unpaid bills.",
      },
      {
        title: "Add a bill",
        detail: "Use Add to enter a new vendor bill.",
        highlight: "Add",
      },
      {
        title: "Open for payment or edit",
        detail:
          "Open a bill to review coding, submit for approval, or continue to Pay bills when it is ready to pay.",
      },
    ],
  },
  {
    id: "ap-bill-form",
    match: /(?:^|[^a-z])bill(?:$|[^a-z])|vendor\s*invoice/i,
    module: "Accounts_Payable",
    conceptIds: ["accounts-payable", "vendors", "purchasing"],
    skillPathId: "procure-to-pay",
    suggestedQuery: "How do I enter an Accounts Payable bill?",
    helpUrl: `${H}/Accounts_Payable/Bills/bills.htm`,
    highlightLabels: ["Vendor", "Bill number", "Date", "Amount"],
    guideSteps: [
      {
        title: "Open a bill",
        detail:
          "You are on Accounts Payable → Bill. Use this screen to record what you owe a vendor before you pay them.",
      },
      {
        title: "Choose the vendor",
        detail:
          "Select Vendor first. Defaults for terms, GL account, and dimensions often come from the vendor record.",
        highlight: "Vendor",
      },
      {
        title: "Enter bill header",
        detail:
          "Confirm Date, GL posting date, and Bill number so the bill posts to the right period and stays unique.",
        highlight: "Bill number",
      },
      {
        title: "Add line entries",
        detail:
          "In Entries, code Account and Amount (and dimensions as required). Match to a PO when purchasing controls apply.",
        highlight: "Amount",
      },
      {
        title: "Submit for posting or approval",
        detail:
          "Save/post when coding is complete, or route for approval if your company requires it before payment.",
      },
    ],
  },
  {
    id: "vendors",
    match: /\bvendors?\b/i,
    module: "Accounts_Payable",
    conceptIds: ["vendors", "accounts-payable"],
    skillPathId: "procure-to-pay",
    suggestedQuery: "How do I create or update a vendor?",
    helpUrl: `${H}/Accounts_Payable/Vendors/vendors_overview.htm`,
    highlightLabels: ["Add"],
    guideSteps: [
      {
        title: "Manage vendors",
        detail:
          "Vendor records drive terms, default accounts, 1099 flags, and payment methods for every bill.",
      },
      {
        title: "Add or open a vendor",
        detail:
          "Use Add for a new vendor, or open an existing record to update contacts, terms, and banking.",
        highlight: "Add",
      },
      {
        title: "Keep masters clean",
        detail:
          "Accurate vendor data prevents duplicate payees and bad defaults on bills and payments.",
      },
    ],
  },
  {
    id: "ar-invoices-list",
    match: /\binvoices\b/i,
    module: "Accounts_Receivable",
    conceptIds: ["accounts-receivable"],
    skillPathId: "order-to-cash",
    suggestedQuery: "How do I find or create AR invoices?",
    helpUrl: `${H}/Accounts_Receivable/accounts_receivable.htm`,
    highlightLabels: ["Add"],
    guideSteps: [
      {
        title: "Browse invoices",
        detail:
          "This list shows customer invoices. Filter by status, customer, or date to find what you need.",
      },
      {
        title: "Add an invoice",
        detail: "Use Add to create a new customer invoice.",
        highlight: "Add",
      },
      {
        title: "Print, email, or apply cash",
        detail:
          "Open an invoice to print/email, adjust, or continue to receive payments against it.",
      },
    ],
  },
  {
    id: "ar-invoice-form",
    match: /(?:^|[^a-z])invoice(?:$|[^a-z])/i,
    module: "Accounts_Receivable",
    conceptIds: ["accounts-receivable"],
    skillPathId: "order-to-cash",
    suggestedQuery: "How do I create a customer invoice?",
    helpUrl: `${H}/Accounts_Receivable/accounts_receivable.htm`,
    highlightLabels: ["Customer", "Invoice number", "Date"],
    guideSteps: [
      {
        title: "Create the invoice",
        detail:
          "AR invoices bill customers for goods or services and drive revenue and receivables.",
      },
      {
        title: "Select the customer",
        detail:
          "Choose Customer first so terms, bill-to, and defaults populate correctly.",
        highlight: "Customer",
      },
      {
        title: "Add lines and post",
        detail:
          "Enter amounts and accounts/items, then submit so the invoice appears in AR aging.",
      },
    ],
  },
  {
    id: "customers",
    match: /\bcustomers?\b/i,
    module: "Accounts_Receivable",
    conceptIds: ["accounts-receivable"],
    skillPathId: "order-to-cash",
    suggestedQuery: "How do I create or update a customer?",
    helpUrl: `${H}/Accounts_Receivable/accounts_receivable.htm`,
    highlightLabels: ["Add"],
    guideSteps: [
      {
        title: "Manage customers",
        detail:
          "Customer records hold bill-to/ship-to, terms, and defaults used on every invoice.",
      },
      {
        title: "Add or open a customer",
        detail: "Use Add for a new customer, or open one to update contacts and terms.",
        highlight: "Add",
      },
      {
        title: "Then invoice",
        detail:
          "Once the customer is correct, create invoices from AR (or Order Entry when you sell via OE).",
      },
    ],
  },
  {
    id: "receive-payments",
    match: /receive\s*payments?|posted\s*payments?/i,
    module: "Accounts_Receivable",
    conceptIds: ["accounts-receivable", "cash-management"],
    skillPathId: "order-to-cash",
    suggestedQuery: "How do I apply a customer payment to invoices?",
    helpUrl: `${H}/Accounts_Receivable/accounts_receivable.htm`,
    highlightLabels: ["Add", "Customer"],
    guideSteps: [
      {
        title: "Receive customer payments",
        detail:
          "Apply cash to open invoices so AR aging stays accurate and deposits can be made.",
      },
      {
        title: "Select customer and invoices",
        detail:
          "Choose the customer (and invoices) the payment applies to before you post.",
        highlight: "Customer",
      },
      {
        title: "Post and deposit",
        detail:
          "Post the receipt, then use Cash Management deposits when you bank the funds.",
      },
    ],
  },
  {
    id: "gl-accounts",
    match: /general\s*ledger\s*accounts|\baccounts\b(?!\s*payable|\s*receivable)|chart\s*of\s*accounts/i,
    module: "General_Ledger",
    conceptIds: ["chart-of-accounts", "general-ledger"],
    skillPathId: "ledger-foundations",
    suggestedQuery: "How do I set up a GL account?",
    helpUrl: `${H}/General_Ledger/GL_accounts/GL_account_setup.htm`,
    highlightLabels: ["Add"],
    guideSteps: [
      {
        title: "Chart of accounts",
        detail:
          "GL accounts are the backbone of posting and reporting. Each transaction codes to an account.",
      },
      {
        title: "Add or review an account",
        detail:
          "Use Add for a new account. Confirm type, normal balance, and reporting category.",
        highlight: "Add",
      },
      {
        title: "Keep structure stable",
        detail:
          "Prefer dimensions over exploding the chart when you need location/dept/project detail.",
      },
    ],
  },
  {
    id: "bank-reconciliation",
    match: /reconcil\w*\s*bank|check\s*reconcil|bank\s*reconcil/i,
    module: "Cash_Management",
    conceptIds: ["bank-reconciliation", "cash-management"],
    skillPathId: "cash-and-banking",
    suggestedQuery: "How do I reconcile a bank account in Sage Intacct?",
    helpUrl: `${H}/Cash_Management/Bank_reconciliation/bank_reconciliation.htm`,
    highlightLabels: ["Statement ending date", "Unmatched"],
    guideSteps: [
      {
        title: "Reconcile the bank",
        detail:
          "Match Intacct cash activity to the bank statement so books and bank agree.",
      },
      {
        title: "Set statement ending date",
        detail:
          "Enter the statement ending date and work unmatched transactions until the difference is zero.",
        highlight: "Statement ending date",
      },
      {
        title: "Save the reconciliation",
        detail:
          "Complete when cleared items match the statement. Unreconciled items become close surprises.",
      },
    ],
  },
  {
    id: "bank-transactions",
    match: /bank\s*transactions?/i,
    module: "Cash_Management",
    conceptIds: ["cash-management", "bank-reconciliation"],
    skillPathId: "cash-and-banking",
    suggestedQuery: "How do I work with bank transactions?",
    helpUrl: `${H}/Cash_Management/cash_management.htm`,
    highlightLabels: ["Add"],
    guideSteps: [
      {
        title: "Bank transactions",
        detail:
          "This list is cash activity for bank and credit-card accounts in Cash Management.",
      },
      {
        title: "Review and add activity",
        detail:
          "Open transactions to correct coding, or add activity that should hit the bank subledger.",
      },
      {
        title: "Reconcile regularly",
        detail:
          "Use bank reconciliation so statement and books stay aligned before period close.",
      },
    ],
  },
  {
    id: "manual-deposits",
    match: /manual\s*deposits?/i,
    module: "Cash_Management",
    conceptIds: ["cash-management", "accounts-receivable"],
    skillPathId: "cash-and-banking",
    suggestedQuery: "How do I record a manual deposit?",
    helpUrl: `${H}/Cash_Management/cash_management.htm`,
    highlightLabels: ["Add"],
    guideSteps: [
      {
        title: "Manual deposits",
        detail:
          "Group receipts into a deposit that matches what you take to the bank.",
      },
      {
        title: "Add a deposit",
        detail: "Use Add, select undeposited funds/receipts, and post the deposit.",
        highlight: "Add",
      },
      {
        title: "Then reconcile",
        detail:
          "The deposit should appear in bank reconciliation when the bank clears it.",
      },
    ],
  },
  {
    id: "purchase-order",
    match: /purchase\s*order|purchasing\s*transactions/i,
    module: "Purchasing",
    conceptIds: ["purchasing", "vendors", "accounts-payable"],
    skillPathId: "procure-to-pay",
    suggestedQuery: "How do I create a purchase order?",
    helpUrl: `${H}/Purchasing/purchasing_overview.htm`,
    highlightLabels: ["Add", "Vendor"],
    guideSteps: [
      {
        title: "Purchasing transactions",
        detail:
          "Purchase orders control spend before the AP bill. Receiving enables matching.",
      },
      {
        title: "Create or open a PO",
        detail:
          "Add a PO for the vendor and items/services you are committing to buy.",
        highlight: "Vendor",
      },
      {
        title: "Receive and bill",
        detail:
          "Receive goods/services, then enter or match the AP bill against the PO.",
      },
    ],
  },
  {
    id: "sales-order",
    match: /sales\s*order|order\s*entry\s*transactions/i,
    module: "Order_Entry",
    conceptIds: ["order-entry", "accounts-receivable"],
    skillPathId: "order-to-cash",
    suggestedQuery: "How do I create a sales order?",
    helpUrl: `${H}/Order_Entry/order_entry_overview.htm`,
    highlightLabels: ["Add", "Customer"],
    guideSteps: [
      {
        title: "Order Entry transactions",
        detail:
          "Sales orders capture customer demand and can convert to invoices.",
      },
      {
        title: "Create or open an order",
        detail: "Add an order for the customer and items/services sold.",
        highlight: "Customer",
      },
      {
        title: "Convert to invoice",
        detail:
          "When ready to bill, convert or generate the AR invoice so revenue and AR update.",
      },
    ],
  },
  {
    id: "budgets",
    match: /\bbudgets?\b/i,
    module: "General_Ledger",
    conceptIds: ["budgets", "general-ledger"],
    skillPathId: "ledger-foundations",
    suggestedQuery: "How do I set up or use budgets in Sage Intacct?",
    helpUrl: `${H}/General_Ledger/Budgeting/budgets_overview.htm`,
    highlightLabels: ["Add"],
    guideSteps: [
      {
        title: "Budgets",
        detail:
          "Budgets hold plan amounts by account and dimension for reporting and control.",
      },
      {
        title: "Create or open a budget",
        detail: "Add a budget version, then enter or import amounts.",
        highlight: "Add",
      },
      {
        title: "Report actual vs budget",
        detail:
          "Use financial reports that compare actual activity to the budget you maintain here.",
      },
    ],
  },
  {
    id: "reporting-periods",
    match: /reporting\s*periods?/i,
    module: "Reporting",
    conceptIds: ["reporting-periods", "close-books", "financial-reporting"],
    skillPathId: "period-close",
    suggestedQuery: "How do reporting periods work with close?",
    helpUrl: `${H}/Reporting/Setup/Reporting_periods/about-reporting-periods.htm`,
    highlightLabels: ["Add"],
    guideSteps: [
      {
        title: "Reporting periods",
        detail:
          "Reporting periods define the calendar used for posting windows and close.",
      },
      {
        title: "Review open vs closed",
        detail:
          "Confirm which periods are open before you post or run Close books.",
      },
      {
        title: "Align with close",
        detail:
          "Period setup must match how you close subledgers and GL books each month.",
      },
    ],
  },
];

/** Module → default skill path when no screen spine matches. */
export const MODULE_SKILL_PATHS: Record<string, string> = {
  General_Ledger: "ledger-foundations",
  Accounts_Payable: "procure-to-pay",
  Accounts_Receivable: "order-to-cash",
  Purchasing: "procure-to-pay",
  Order_Entry: "order-to-cash",
  Cash_Management: "cash-and-banking",
  Company: "multi-entity",
  Reporting: "period-close",
  Consolidation: "multi-entity",
};

export function buildModuleGuideSteps(
  module: string,
  screen: string
): { title: string; detail: string; highlight?: string }[] {
  const label =
    screen ||
    module.replace(/_/g, " ") ||
    "this Intacct screen";
  const niceModule = module.replace(/_/g, " ") || "this area";
  return [
    {
      title: `You're on ${label}`,
      detail: `Smart Help mapped this page to ${niceModule}. Use the steps below to get oriented, then open Sage Help or Ask for a cited procedure.`,
    },
    {
      title: "Open the Help topic",
      detail:
        "Use Open Sage Intacct Help topic for the canonical Help Center page for this area of the product.",
    },
    {
      title: "Ask for a procedure",
      detail:
        "Switch to Ask with a question like “How do I … on this screen?” to get a cited step-by-step answer when the local engine is available.",
    },
    {
      title: "Explore related concepts",
      detail:
        "Use Context for concept cards, Skill Paths, and relationships that connect this screen to the rest of Intacct.",
    },
  ];
}

export function buildGenericGuideSteps(
  screen: string,
  title: string
): { title: string; detail: string; highlight?: string }[] {
  const label = screen || title || "this screen";
  return [
    {
      title: `Help for ${label}`,
      detail:
        "This page is not in the detailed demo spine yet. You can still open Sage Help, ask a procedure question, or explore concepts for nearby topics.",
    },
    {
      title: "Ask about this screen",
      detail:
        "Describe what you want to accomplish. Ask works best with a concrete goal (create, reverse, close, pay, reconcile).",
    },
    {
      title: "Explore concepts",
      detail:
        "Use the Context tab to browse related Intacct concepts and Skill Paths while you stay beside this page.",
    },
  ];
}
