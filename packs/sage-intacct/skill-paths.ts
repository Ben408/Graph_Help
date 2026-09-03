import type { SkillPath } from "@/lib/knowledge/types";

export const skillPaths: SkillPath[] = [
  {
    id: "period-close",
    title: "Period close",
    summary:
      "A month-end sequence from bank rec through subledger close, allocations, books, and reports.",
    audience: "Controllers and accountants who own period-end",
    goal: "Run a repeatable close without skipping a control",
    estimatedMinutes: 50,
    difficulty: "intermediate",
    completionCriteria:
      "You can name each close control in order and complete the Help task for the step you are on.",
    steps: [
      {
        conceptId: "bank-reconciliation",
        rationale:
          "Prove cash before you lock subledgers. Unreconciled items become close surprises.",
        practiceQuery: "reconcile a bank account in Sage Intacct",
        moduleHints: ["Cash_Management"],
      },
      {
        conceptId: "accounts-payable",
        rationale:
          "Complete AP: remaining bills, payments, and AP close so expenses hit the right period.",
        practiceQuery: "close accounts payable for the period",
        moduleHints: ["Accounts_Payable"],
      },
      {
        conceptId: "accounts-receivable",
        rationale:
          "Finish invoicing and cash application so revenue and AR aging match the period.",
        practiceQuery: "close accounts receivable for the period",
        moduleHints: ["Accounts_Receivable"],
      },
      {
        conceptId: "allocations",
        rationale:
          "Run period allocations after operational ledgers are complete, before you close books.",
        practiceQuery: "run month-end account allocations",
        moduleHints: ["General_Ledger"],
      },
      {
        conceptId: "close-workspace",
        rationale:
          "Close Workspace is the checklist for remaining close tasks before you lock the books.",
        practiceQuery: "use Close Workspace for period close",
        moduleHints: ["Copilot", "General_Ledger"],
      },
      {
        conceptId: "close-books",
        rationale:
          "Lock the period so nobody can post dated transactions into a range you already reported.",
        practiceQuery: "close books in General Ledger",
        moduleHints: ["General_Ledger"],
      },
      {
        conceptId: "financial-reporting",
        rationale:
          "Publish financial statements only after books and allocations are done.",
        practiceQuery: "run period-end financial reports",
        moduleHints: ["Reporting"],
      },
    ],
  },
  {
    id: "procure-to-pay",
    title: "Procure-to-pay",
    summary:
      "Vendor master data through purchasing, AP, automation, and payment — the P2P cycle.",
    audience: "AP specialists and procurement accountants",
    goal: "Process vendor spend accurately from request to payment",
    estimatedMinutes: 35,
    difficulty: "introductory",
    completionCriteria:
      "You can take a vendor from master data through bill and payment in the Help procedures.",
    steps: [
      {
        conceptId: "vendors",
        rationale: "Clean vendor records, terms, and 1099 setup are the gate to every bill.",
        practiceQuery: "create a vendor in Accounts Payable",
        moduleHints: ["Accounts_Payable"],
      },
      {
        conceptId: "purchasing",
        rationale: "Purchase orders and receiving enable matching and control spend.",
        practiceQuery: "create a purchase order",
        moduleHints: ["Purchasing"],
      },
      {
        conceptId: "accounts-payable",
        rationale: "Bills, approvals, and matching are the core AP workflow.",
        practiceQuery: "enter and approve a vendor bill",
        moduleHints: ["Accounts_Payable"],
      },
      {
        conceptId: "ap-automation",
        rationale: "OCR and automated capture reduce keying when volume grows.",
        practiceQuery: "set up AP Automation for bills",
        moduleHints: ["Accounts_Payable"],
      },
      {
        conceptId: "vendor-payments",
        rationale: "Pay approved bills by check, ACH, or electronic payment and post cash.",
        practiceQuery: "pay vendor bills",
        moduleHints: ["Accounts_Payable"],
      },
    ],
  },
  {
    id: "multi-entity",
    title: "Multi-entity",
    summary:
      "Entity structure, currencies, dimensions, consolidation, and group reporting.",
    audience: "Accountants in multi-subsidiary or multi-location organizations",
    goal: "Operate many entities in one instance and produce a consolidated view",
    estimatedMinutes: 45,
    difficulty: "advanced",
    completionCriteria:
      "You can explain entity, currency, dimensions, and consolidation as one operating model.",
    steps: [
      {
        conceptId: "multi-entity",
        rationale: "Entity hierarchy, shared masters, and intercompany are the operating model.",
        practiceQuery: "set up a multi-entity company",
        moduleHints: ["Consolidation"],
      },
      {
        conceptId: "multi-currency",
        rationale: "Each entity may transact and report in its own currency.",
        practiceQuery: "configure multi-currency for an entity",
        moduleHints: ["Consolidation"],
      },
      {
        conceptId: "dimensions",
        rationale:
          "Location and entity-aware dimensions keep reporting useful without exploding the chart.",
        practiceQuery: "use dimensions across entities",
        moduleHints: ["Company"],
      },
      {
        conceptId: "consolidation",
        rationale: "Eliminations and translation produce the group set of books.",
        practiceQuery: "run a consolidation",
        moduleHints: ["Consolidation"],
      },
      {
        conceptId: "financial-reporting",
        rationale: "Consolidated statements are the output the board and auditors consume.",
        practiceQuery: "run a consolidated income statement",
        moduleHints: ["Reporting"],
      },
    ],
  },
  {
    id: "order-to-cash",
    title: "Order-to-cash",
    summary:
      "From order and invoice through cash application — the O2C cycle.",
    audience: "AR and billing accountants",
    goal: "Bill customers and apply cash so AR aging tells the truth",
    estimatedMinutes: 30,
    difficulty: "introductory",
    completionCriteria:
      "You can invoice, apply cash, and read AR aging for the period.",
    steps: [
      {
        conceptId: "accounts-receivable",
        rationale: "Customer records, invoices, and AR settings are the billing backbone.",
        practiceQuery: "create and send a customer invoice",
        moduleHints: ["Accounts_Receivable"],
      },
      {
        conceptId: "order-entry",
        rationale: "Orders feed invoices when you sell items or services through OE.",
        practiceQuery: "convert an order to an invoice",
        moduleHints: ["Order_Entry"],
      },
      {
        conceptId: "cash-management",
        rationale: "Deposits and receipts are how customer payments hit the bank.",
        practiceQuery: "apply a customer payment to invoices",
        moduleHints: ["Cash_Management", "Accounts_Receivable"],
      },
      {
        conceptId: "financial-reporting",
        rationale: "AR aging and revenue reports close the O2C loop for the controller.",
        practiceQuery: "run an AR aging report",
        moduleHints: ["Reporting", "Accounts_Receivable"],
      },
    ],
  },
  {
    id: "cash-and-banking",
    title: "Cash and banking",
    summary:
      "Bank accounts, reconciliation, outbound payments, and cash visibility.",
    audience: "Treasury and staff accountants who own cash",
    goal: "Know what cash you have and keep books aligned with the bank",
    estimatedMinutes: 25,
    difficulty: "introductory",
    completionCriteria:
      "You can reconcile a bank account and see outbound payments in cash position.",
    steps: [
      {
        conceptId: "cash-management",
        rationale: "Bank and credit-card accounts are the cash subledger.",
        practiceQuery: "set up a checking account",
        moduleHints: ["Cash_Management"],
      },
      {
        conceptId: "bank-reconciliation",
        rationale: "Matching statements to books is the primary cash control.",
        practiceQuery: "perform bank reconciliation",
        moduleHints: ["Cash_Management"],
      },
      {
        conceptId: "vendor-payments",
        rationale: "Outbound payments move cash; they must clear in rec.",
        practiceQuery: "process vendor payments",
        moduleHints: ["Accounts_Payable"],
      },
      {
        conceptId: "dashboards",
        rationale: "Cash position dashboards turn rec and payments into a daily view.",
        practiceQuery: "create a cash dashboard",
        moduleHints: ["Reporting"],
      },
    ],
  },
  {
    id: "ledger-foundations",
    title: "Ledger foundations",
    summary:
      "How the books are structured: chart, dimensions, journals, GL, then reports.",
    audience: "New Intacct accountants and anyone learning the map before close",
    goal: "Understand how transactions are classified and posted before you close a period",
    estimatedMinutes: 40,
    difficulty: "introductory",
    completionCriteria:
      "You can trace an account, dimension, journal, period, and close back to a report.",
    steps: [
      {
        conceptId: "chart-of-accounts",
        rationale: "Accounts classify what happened. A messy chart makes every report harder.",
        practiceQuery: "set up the chart of accounts",
        moduleHints: ["General_Ledger"],
      },
      {
        conceptId: "dimensions",
        rationale:
          "Dimensions classify who/where/why without exploding account numbers — Intacct’s core idea.",
        practiceQuery: "enable and use dimensions",
        moduleHints: ["Company"],
      },
      {
        conceptId: "journal-entries",
        rationale: "Every posting is a journal. Manual, reversing, and subledger-generated.",
        practiceQuery: "create a journal entry",
        moduleHints: ["General_Ledger"],
      },
      {
        conceptId: "reporting-periods",
        rationale:
          "Named periods are what close and reports select — without them you cannot lock the books.",
        practiceQuery: "create a reporting period",
        moduleHints: ["Reporting", "General_Ledger"],
      },
      {
        conceptId: "general-ledger",
        rationale: "The GL is the hub every module posts to.",
        practiceQuery: "open the general ledger",
        moduleHints: ["General_Ledger"],
      },
      {
        conceptId: "close-books",
        rationale: "Closing books is the control that ends the editable period.",
        practiceQuery: "close books for a period",
        moduleHints: ["General_Ledger"],
      },
      {
        conceptId: "financial-reporting",
        rationale: "Reports are how you verify the map is working.",
        practiceQuery: "run a trial balance",
        moduleHints: ["Reporting"],
      },
    ],
  },
];
