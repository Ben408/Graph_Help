import type { Concept, RelationshipType } from "@/lib/knowledge/types";

export const RELATIONSHIP_LABELS: Record<RelationshipType, string> = {
  REQUIRES: "Requires",
  PART_OF: "Part of",
  USED_BY: "Used by",
  CONTRASTS_WITH: "Contrasts with",
  EXTENDS: "Extends",
};

export const CATEGORIES = [
  "Core Financials",
  "Accounts Payable",
  "Accounts Receivable",
  "Cash Management",
  "Administration",
  "Reporting",
  "Multi-Entity",
  "Revenue Management",
  "Order Management",
  "Asset Management",
  "Time & Expenses",
  "Tax & Compliance",
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  "Core Financials": "#10b981",
  "Accounts Payable": "#3b82f6",
  "Accounts Receivable": "#f59e0b",
  "Cash Management": "#8b5cf6",
  "Administration": "#ef4444",
  "Reporting": "#06b6d4",
  "Multi-Entity": "#ec4899",
  "Revenue Management": "#f97316",
  "Order Management": "#14b8a6",
  "Asset Management": "#a855f7",
  "Time & Expenses": "#f43f5e",
  "Tax & Compliance": "#64748b",
};

export const concepts: Concept[] = [
  {
    id: "general-ledger",
    title: "General Ledger",
    summary:
      "The central hub for all financial accounts, journals, and reporting in Sage Intacct.",
    whyItMatters:
      "The General Ledger is the foundation of your entire financial system. Every transaction across all modules eventually posts to the GL, making it the single source of truth for your organization's financial health. Sage Intacct's AI-powered GL can flag anomalies in real-time by comparing journal entries to historical patterns, providing continuous financial assurance.",
    keyDetails: [
      "Maintains the chart of accounts with financial and statistical account types",
      "Supports journal entries for recording all financial transactions",
      "Powers budgets, forecasts, and financial reporting",
      "AI-driven anomaly detection compares entries to historical patterns",
      "Streamlines chart of accounts to reduce transaction tagging errors",
      "Supports multiple books (accrual, cash, tax, IFRS)",
      "Enables drill-down from reports to source transactions",
    ],
    relationships: [
      // Children already declare PART_OF → general-ledger. Do not invert.
      { targetId: "dimensions", type: "REQUIRES" },
      { targetId: "reporting-periods", type: "REQUIRES" },
      { targetId: "financial-reporting", type: "USED_BY" },
      { targetId: "accounts-payable", type: "USED_BY" },
      { targetId: "accounts-receivable", type: "USED_BY" },
    ],
    examples: [
      "Post a manual journal entry to reclassify an expense",
      "Run a trial balance to verify debits equal credits",
      "Create a budget for the upcoming fiscal year",
    ],
    tasks: [
      "Set up your chart of accounts",
      "Configure journal symbols",
      "Create a budget",
      "Run financial reports",
    ],
    category: "Core Financials",
  },
  {
    id: "chart-of-accounts",
    title: "Chart of Accounts",
    summary:
      "The organized listing of all financial and statistical accounts used to classify transactions.",
    whyItMatters:
      "A well-structured chart of accounts is critical for accurate financial reporting and compliance. In Sage Intacct, the chart of accounts supports both financial accounts (tracking monetary value) and statistical accounts (tracking operational data like headcount), enabling powerful metrics such as revenue per employee.",
    keyDetails: [
      "Financial accounts track monetary values (assets, liabilities, equity, revenue, expenses)",
      "Statistical accounts track non-monetary operational data",
      "Account numbers and structure define your reporting hierarchy",
      "Accounts can be restricted to specific entities in multi-entity setups",
      "Supports account groups for organized financial statements",
      "Enables mapping to external reporting frameworks",
    ],
    relationships: [
      { targetId: "general-ledger", type: "PART_OF" },
      { targetId: "dimensions", type: "USED_BY" },
      { targetId: "journal-entries", type: "USED_BY" },
      { targetId: "financial-reporting", type: "USED_BY" },
      { targetId: "multi-entity", type: "USED_BY" },
    ],
    tasks: [
      "Design your account structure",
      "Create financial accounts",
      "Set up statistical accounts",
      "Assign accounts to entities",
    ],
    category: "Core Financials",
  },
  {
    id: "journal-entries",
    title: "Journal Entries",
    summary:
      "The fundamental records of financial transactions posted to the General Ledger.",
    whyItMatters:
      "Journal entries are how every financial transaction is recorded in your system. Whether generated automatically by sub-ledger modules (AP, AR, Cash Management) or entered manually, journal entries ensure your books stay balanced and provide a complete audit trail for every dollar that moves through your organization.",
    keyDetails: [
      "Must always balance (total debits must equal total credits)",
      "Can be posted manually or generated automatically from sub-modules",
      "Support multiple currencies with exchange rate tracking",
      "Can be tagged with dimensions for granular reporting",
      "Recurring journal entries automate periodic postings",
      "Reversing entries handle accruals and deferrals",
      "Each entry includes a journal symbol identifying its source",
    ],
    relationships: [
      { targetId: "general-ledger", type: "PART_OF" },
      { targetId: "chart-of-accounts", type: "REQUIRES" },
      { targetId: "dimensions", type: "USED_BY" },
      { targetId: "accounts-payable", type: "USED_BY" },
      { targetId: "accounts-receivable", type: "USED_BY" },
      { targetId: "multi-currency", type: "USED_BY" },
    ],
    examples: [
      "Debit Rent Expense, Credit Accounts Payable for monthly rent",
      "Create a reversing accrual entry at month-end",
      "Post intercompany elimination entries during consolidation",
    ],
    category: "Core Financials",
  },
  {
    id: "dimensions",
    title: "Dimensions",
    summary:
      "A powerful classification system for tagging transactions to enable multi-dimensional reporting and analysis.",
    whyItMatters:
      "Dimensions are what make Sage Intacct's reporting truly powerful. Instead of relying solely on account numbers, dimensions let you slice and dice your financial data across multiple axes - by department, location, project, customer, vendor, and more. This eliminates the need for an overly complex chart of accounts and provides instant visibility into profitability, project ROI, and product line performance.",
    keyDetails: [
      "Standard dimensions include Department, Location, Project, Customer, Vendor, Employee, Item, and Class",
      "User-defined dimensions (UDDs) extend the system for custom needs",
      "Applied across GL, AR, AP, and revenue management modules",
      "Enable drill-down reporting without expanding the chart of accounts",
      "Support hierarchical structures for roll-up reporting",
      "Can be required or optional on transactions",
      "Power real-time dashboards and financial analytics",
    ],
    relationships: [
      { targetId: "general-ledger", type: "USED_BY" },
      { targetId: "financial-reporting", type: "USED_BY" },
      { targetId: "chart-of-accounts", type: "EXTENDS" },
      { targetId: "journal-entries", type: "USED_BY" },
      { targetId: "budgets", type: "USED_BY" },
      { targetId: "accounts-payable", type: "USED_BY" },
      { targetId: "accounts-receivable", type: "USED_BY" },
    ],
    examples: [
      "Tag an expense to the Marketing department and the West Coast location",
      "Create a custom dimension for tracking expenses by grant number",
      "Run a profit & loss report filtered by project dimension",
    ],
    tasks: [
      "Enable standard dimensions",
      "Create user-defined dimensions",
      "Set dimension requirements on transactions",
    ],
    category: "Core Financials",
  },
  {
    id: "accounts-payable",
    title: "Accounts Payable",
    summary:
      "Manages the entire vendor payment cycle from bill entry through payment and reconciliation.",
    whyItMatters:
      "Accounts Payable automation is one of the highest-ROI areas in financial management. Sage Intacct's AP module streamlines bill entry, approval workflows, and payment processing, reducing manual data entry and accelerating the procure-to-pay cycle. Automated matching of bills to purchase orders and configurable approval routing ensure accuracy and compliance while improving vendor relationships through timely payments.",
    keyDetails: [
      "Automated workflows for bill approval and payment routing",
      "Draft bills can be created and matched to purchase orders",
      "Configurable journals for AP transactions (bills, adjustments, payments)",
      "Supports advances at the entity level in multi-entity setups",
      "Vendor management with payment terms and 1099 tracking",
      "Batch payment processing for checks, ACH, and electronic payments",
      "Aging reports for cash flow planning",
    ],
    relationships: [
      { targetId: "general-ledger", type: "PART_OF" },
      { targetId: "vendors", type: "REQUIRES" },
      { targetId: "cash-management", type: "USED_BY" },
      { targetId: "dimensions", type: "USED_BY" },
      { targetId: "multi-entity", type: "USED_BY" },
      { targetId: "accounts-receivable", type: "CONTRASTS_WITH" },
      { targetId: "purchasing", type: "REQUIRES" },
    ],
    examples: [
      "Enter a vendor bill and route it through a two-step approval workflow",
      "Run a batch payment for all bills due this week",
      "Match a bill to an existing purchase order for three-way matching",
    ],
    tasks: [
      "Configure AP settings and journals",
      "Set up approval workflows",
      "Create vendor records",
      "Process payments",
    ],
    category: "Accounts Payable",
  },
  {
    id: "accounts-receivable",
    title: "Accounts Receivable",
    summary:
      "Automates invoicing, collections, and cash application to accelerate revenue collection.",
    whyItMatters:
      "Efficient accounts receivable management directly impacts your cash flow and working capital. Sage Intacct's AR module automates the order-to-cash cycle, from creating and sending invoices to applying payments and managing collections. Automated dunning, flexible payment terms, and real-time aging reports help you get paid faster while maintaining strong customer relationships.",
    keyDetails: [
      "Automated invoice creation and delivery (email, print, portal)",
      "Flexible payment terms and credit limit management",
      "Quick invoice entry for high-volume billing",
      "Recurring invoices for subscription and retainer billing",
      "Automated payment application and cash receipts",
      "Deposit tracking and management",
      "Penalty and late fee assessment",
      "AR aging reports for collections management",
    ],
    relationships: [
      { targetId: "general-ledger", type: "PART_OF" },
      { targetId: "cash-management", type: "USED_BY" },
      { targetId: "dimensions", type: "USED_BY" },
      { targetId: "revenue-recognition", type: "USED_BY" },
      { targetId: "accounts-payable", type: "CONTRASTS_WITH" },
      { targetId: "multi-entity", type: "USED_BY" },
      { targetId: "contracts", type: "USED_BY" },
    ],
    examples: [
      "Generate monthly invoices for all active subscriptions",
      "Apply a customer payment to multiple outstanding invoices",
      "Run an aging report to identify overdue accounts",
    ],
    tasks: [
      "Configure AR settings",
      "Set up customer records",
      "Create and send invoices",
      "Apply payments",
    ],
    category: "Accounts Receivable",
  },
  {
    id: "cash-management",
    title: "Cash Management",
    summary:
      "Tracks and manages all bank accounts, deposits, receipts, and reconciliations.",
    whyItMatters:
      "Cash is the lifeblood of any business. Sage Intacct's Cash Management module provides real-time visibility into your cash position across all bank accounts and entities. It streamlines bank reconciliations, manages deposits and receipts, and supports credit card transaction tracking, giving you the control you need to make informed financial decisions and maintain healthy cash flow.",
    keyDetails: [
      "Manages checking accounts, savings accounts, and credit card accounts",
      "Bank reconciliation with imported transaction matching",
      "Deposit tracking including undeposited funds management",
      "Other receipts and miscellaneous transaction recording",
      "Credit card transaction tracking and charge payoffs",
      "Bank interest and charges recording",
      "Fund transfers between accounts with currency support",
    ],
    relationships: [
      { targetId: "general-ledger", type: "PART_OF" },
      { targetId: "accounts-payable", type: "USED_BY" },
      { targetId: "accounts-receivable", type: "USED_BY" },
      { targetId: "bank-reconciliation", type: "PART_OF" },
      { targetId: "multi-currency", type: "USED_BY" },
      { targetId: "multi-entity", type: "USED_BY" },
    ],
    tasks: [
      "Set up bank accounts",
      "Import bank transactions",
      "Perform bank reconciliation",
      "Process deposits",
    ],
    category: "Cash Management",
  },
  {
    id: "bank-reconciliation",
    title: "Bank Reconciliation",
    summary:
      "The process of matching internal records against bank statements to ensure accuracy.",
    whyItMatters:
      "Bank reconciliation is a critical internal control that catches errors, fraud, and timing differences between your books and your bank. In a multi-currency environment, reconciliations must account for exchange rate differences. Sage Intacct supports importing bank statements and matching transactions automatically, dramatically reducing the time and effort required to close your books each period.",
    keyDetails: [
      "Import bank transaction history for automated matching",
      "Reconciliations occur in the currency of the bank account",
      "Multi-base currency requires careful handling of imported transactions",
      "Supports clearing of outstanding checks and deposits in transit",
      "Reconciliation reports identify discrepancies and unmatched items",
      "Credit cards are reconciled at the entity level",
    ],
    relationships: [
      { targetId: "cash-management", type: "PART_OF" },
      { targetId: "multi-currency", type: "USED_BY" },
      { targetId: "general-ledger", type: "USED_BY" },
      { targetId: "multi-entity", type: "USED_BY" },
    ],
    examples: [
      "Import a CSV bank statement and auto-match transactions",
      "Clear outstanding checks that have been cashed",
      "Investigate unmatched bank transactions",
    ],
    category: "Cash Management",
  },
  {
    id: "budgets",
    title: "Budgets",
    summary:
      "Financial planning tools that let you create forecasts and monitor actual vs. planned performance.",
    whyItMatters:
      "Budgets transform your financial system from a backward-looking record keeper into a forward-looking planning tool. Sage Intacct's budgeting capabilities let you create budgets at varying levels of detail - from high-level departmental budgets to granular combinations of accounts, departments, locations, and custom dimensions. Comparing actuals to budgets in real-time helps you spot variances early and take corrective action.",
    keyDetails: [
      "Create budgets by account, department, location, or any dimension combination",
      "Support multiple budget versions (best case, worst case, most likely)",
      "Import budgets from spreadsheets or create them directly in the system",
      "Real-time budget vs. actual variance reporting",
      "Rolling forecasts for continuous planning",
      "Budget hierarchies roll up through dimension structures",
      "Statistical budgets for non-financial metrics",
    ],
    relationships: [
      { targetId: "general-ledger", type: "PART_OF" },
      { targetId: "dimensions", type: "REQUIRES" },
      { targetId: "financial-reporting", type: "USED_BY" },
      { targetId: "chart-of-accounts", type: "REQUIRES" },
    ],
    examples: [
      "Create an annual expense budget by department",
      "Import a budget from Excel with account and dimension mappings",
      "Run a budget vs. actual variance report at quarter-end",
    ],
    tasks: [
      "Plan your budget structure",
      "Create budget entries",
      "Import budgets from spreadsheets",
      "Configure budget reports",
    ],
    category: "Core Financials",
  },
  {
    id: "financial-reporting",
    title: "Financial Reporting",
    summary:
      "Comprehensive reporting tools for generating financial statements, dashboards, and ad-hoc analyses.",
    whyItMatters:
      "Reporting is where all your data comes together to tell the story of your business. Sage Intacct's reporting engine leverages the power of dimensions to deliver insights that traditional accounting systems simply cannot. From standard financial statements to custom dashboards, you can drill down from any report to the underlying transactions, providing complete transparency and audit-ready detail.",
    keyDetails: [
      "Standard financial statements: Balance Sheet, Income Statement, Cash Flow",
      "Custom report builder with drag-and-drop interface",
      "Dimensional filtering and grouping for any report",
      "Drill-down from summary to transaction detail",
      "Scheduled report delivery via email",
      "Real-time dashboards for key financial metrics",
      "Revaluation reports for multi-currency environments",
      "Subledger and aging reports for AP and AR",
    ],
    relationships: [
      { targetId: "general-ledger", type: "REQUIRES" },
      { targetId: "dimensions", type: "REQUIRES" },
      { targetId: "budgets", type: "USED_BY" },
      { targetId: "consolidation", type: "USED_BY" },
      { targetId: "chart-of-accounts", type: "REQUIRES" },
    ],
    examples: [
      "Generate a consolidated income statement across all entities",
      "Create a custom dashboard showing revenue by product line",
      "Schedule a weekly cash flow report for the CFO",
    ],
    tasks: [
      "Run standard financial reports",
      "Build custom reports",
      "Set up dashboards",
      "Schedule report distribution",
    ],
    category: "Reporting",
  },
  {
    id: "multi-entity",
    title: "Multi-Entity Management",
    summary:
      "Manage multiple legal entities, subsidiaries, or business units within a single Sage Intacct instance.",
    whyItMatters:
      "Growing organizations often operate multiple entities - subsidiaries, divisions, or international operations. Sage Intacct's Multi-Entity Management eliminates the need for separate accounting systems by letting you manage all entities in one place. Shared master data reduces duplication, intercompany transactions are automated, and consolidation happens at the push of a button rather than in error-prone spreadsheets.",
    keyDetails: [
      "Centralized management of multiple legal entities",
      "Shared chart of accounts, vendors, and customers across entities",
      "Automated intercompany transaction elimination",
      "Entity-level security and access controls",
      "Each entity can have its own base currency",
      "Top-level vs. entity-level transaction capabilities vary by module",
      "Consolidation for combined financial statements",
    ],
    relationships: [
      { targetId: "consolidation", type: "PART_OF" },
      { targetId: "multi-currency", type: "EXTENDS" },
      { targetId: "general-ledger", type: "REQUIRES" },
      { targetId: "accounts-payable", type: "USED_BY" },
      { targetId: "accounts-receivable", type: "USED_BY" },
      { targetId: "cash-management", type: "USED_BY" },
      { targetId: "user-roles", type: "USED_BY" },
    ],
    tasks: [
      "Set up entity structure",
      "Configure shared master data",
      "Set up intercompany eliminations",
      "Run consolidated reports",
    ],
    category: "Multi-Entity",
  },
  {
    id: "multi-currency",
    title: "Multi-Currency",
    summary:
      "Support for conducting business in multiple currencies with automated exchange rate management.",
    whyItMatters:
      "Organizations operating internationally need to transact, report, and consolidate in multiple currencies. Sage Intacct's multi-currency capabilities handle the complexity of exchange rates, revaluation, and translation so your team doesn't have to manage it manually. Multi-base currency support allows each entity to operate in its own base currency while still consolidating into a single reporting currency.",
    keyDetails: [
      "Multi-base currency allows different base currencies per entity",
      "Automatic exchange rate updates from external rate feeds",
      "Transaction currency can differ from base currency",
      "Revaluation reports for GL, AP, AR, and deferred revenue",
      "Currency filters available on aging reports and subledger reports",
      "Fund transfers between accounts in different currencies are supported",
      "Credit cards must match the base currency of their assigned location",
    ],
    relationships: [
      { targetId: "multi-entity", type: "EXTENDS" },
      { targetId: "cash-management", type: "USED_BY" },
      { targetId: "bank-reconciliation", type: "USED_BY" },
      { targetId: "journal-entries", type: "USED_BY" },
      { targetId: "consolidation", type: "REQUIRES" },
    ],
    examples: [
      "Set the base currency for a Canadian entity to CAD",
      "Record a vendor bill in EUR against a USD entity",
      "Run a revaluation report for open AP items in foreign currency",
    ],
    category: "Multi-Entity",
  },
  {
    id: "consolidation",
    title: "Consolidation",
    summary:
      "Combines financial data from multiple entities into a single set of consolidated financial statements.",
    whyItMatters:
      "For multi-entity organizations, consolidation is how you see the full financial picture. Sage Intacct's consolidation engine handles intercompany eliminations, currency translation, and minority interest calculations automatically. This replaces the manual spreadsheet-based consolidation process that is error-prone and time-consuming, enabling faster, more accurate period-end closes.",
    keyDetails: [
      "Automated intercompany elimination entries",
      "Currency translation for multi-base currency entities",
      "Support for Advanced Ownership Consolidation",
      "Minority interest and partial ownership handling",
      "Consolidation at the push of a button",
      "Eliminates manual spreadsheet consolidation processes",
      "Supports consolidation reporting in a single currency",
    ],
    relationships: [
      { targetId: "multi-entity", type: "REQUIRES" },
      { targetId: "multi-currency", type: "USED_BY" },
      { targetId: "financial-reporting", type: "USED_BY" },
      { targetId: "general-ledger", type: "REQUIRES" },
    ],
    category: "Multi-Entity",
  },
  {
    id: "vendors",
    title: "Vendors",
    summary:
      "Master records for all suppliers and service providers your organization does business with.",
    whyItMatters:
      "Vendor records are the foundation of your procure-to-pay process. Accurate vendor data ensures bills are properly categorized, payments go to the right place, and tax reporting (like 1099s) is correct. In Sage Intacct, vendor records can be shared across entities, reducing duplicate data entry and ensuring consistency across your organization.",
    keyDetails: [
      "Contact information, payment terms, and banking details",
      "1099 tracking and tax identification",
      "Default GL accounts and dimensions for bill coding",
      "Vendor types for classification and reporting",
      "Shared across entities in multi-entity setups",
      "Vendor merge capabilities for deduplication",
    ],
    relationships: [
      { targetId: "accounts-payable", type: "USED_BY" },
      { targetId: "purchasing", type: "USED_BY" },
      { targetId: "dimensions", type: "PART_OF" },
      { targetId: "multi-entity", type: "USED_BY" },
    ],
    category: "Accounts Payable",
  },
  {
    id: "purchasing",
    title: "Purchasing",
    summary:
      "Manages purchase orders and the procurement workflow from requisition to receipt.",
    whyItMatters:
      "A structured purchasing process ensures that spending is authorized, tracked, and matched to vendor bills. Sage Intacct's purchasing module creates a clear paper trail from purchase requisition through purchase order to vendor bill, enabling three-way matching that catches discrepancies before payments are made.",
    keyDetails: [
      "Purchase order creation and management",
      "Multi-step approval workflows for spend authorization",
      "Three-way matching: PO to receipt to vendor bill",
      "Tracks open POs and partial receipts",
      "Supports blanket purchase orders for recurring purchases",
      "Integration with inventory and order management",
    ],
    relationships: [
      { targetId: "accounts-payable", type: "USED_BY" },
      { targetId: "vendors", type: "REQUIRES" },
      { targetId: "inventory-control", type: "USED_BY" },
      { targetId: "dimensions", type: "USED_BY" },
    ],
    category: "Accounts Payable",
  },
  {
    id: "revenue-recognition",
    title: "Revenue Recognition",
    summary:
      "Automates the recognition of revenue according to accounting standards like ASC 606.",
    whyItMatters:
      "Revenue recognition rules are complex and getting them wrong can lead to financial restatements and compliance issues. Sage Intacct automates revenue recognition for contracts, subscriptions, and project-based revenue, ensuring compliance with ASC 606 and IFRS 15. This reduces the risk of errors and frees your accounting team from maintaining manual spreadsheets.",
    keyDetails: [
      "Automated recognition schedules based on configurable rules",
      "Support for ASC 606 and IFRS 15 compliance",
      "Handles point-in-time and over-time recognition",
      "Deferred revenue tracking and management",
      "Multiple element arrangements and performance obligations",
      "Revenue recognition at entity level in multi-entity setups",
      "Integration with contracts and order management",
    ],
    relationships: [
      { targetId: "contracts", type: "REQUIRES" },
      { targetId: "accounts-receivable", type: "USED_BY" },
      { targetId: "general-ledger", type: "USED_BY" },
      { targetId: "multi-entity", type: "USED_BY" },
    ],
    category: "Revenue Management",
  },
  {
    id: "contracts",
    title: "Contracts",
    summary:
      "Manages customer contracts, subscriptions, and their associated billing and revenue schedules.",
    whyItMatters:
      "For subscription and service-based businesses, contracts are the bridge between what you sell and how you recognize revenue. Sage Intacct's contract management tracks the full lifecycle from initial agreement through renewal, handling complex billing schedules, amendments, and revenue recognition rules. Contracts can be managed at the top level or entity level depending on your organizational structure.",
    keyDetails: [
      "Contract lifecycle management from creation to renewal",
      "Flexible billing schedules (monthly, quarterly, annual, milestone)",
      "Amendment tracking with revenue impact calculations",
      "Auto-generation of invoices from contract billing schedules",
      "Can be created at top level or entity level",
      "Revenue recognition and invoice generation may occur at different entity levels",
    ],
    relationships: [
      { targetId: "revenue-recognition", type: "USED_BY" },
      { targetId: "accounts-receivable", type: "USED_BY" },
      { targetId: "multi-entity", type: "USED_BY" },
      { targetId: "dimensions", type: "USED_BY" },
    ],
    category: "Revenue Management",
  },
  {
    id: "inventory-control",
    title: "Inventory Control",
    summary:
      "Tracks physical inventory items, quantities, costs, and warehouse operations.",
    whyItMatters:
      "For product-based businesses, accurate inventory tracking is essential for financial reporting, cost management, and order fulfillment. Sage Intacct's Inventory Control module tracks items across multiple locations, supports various costing methods, and integrates with purchasing and order management to provide real-time inventory visibility.",
    keyDetails: [
      "Item management with multiple costing methods (FIFO, LIFO, average, standard)",
      "Warehouse and bin-level tracking",
      "Kit building for assembled products (entity level only in multi-base currency)",
      "Inventory valuation reports (totals may be limited in multi-base currency)",
      "Integration with purchasing and order management",
      "Stock transfers between warehouses",
    ],
    relationships: [
      { targetId: "purchasing", type: "USED_BY" },
      { targetId: "general-ledger", type: "USED_BY" },
      { targetId: "multi-entity", type: "USED_BY" },
      { targetId: "dimensions", type: "PART_OF" },
    ],
    category: "Core Financials",
  },
  {
    id: "projects",
    title: "Projects",
    summary:
      "Tracks project-based financials including costs, billing, budgets, and profitability.",
    whyItMatters:
      "For service organizations and any business that tracks work by project, Sage Intacct's Projects module provides complete financial visibility into project performance. Track actual costs against budgets, generate project-based invoices, and analyze profitability across your project portfolio. In multi-entity environments, many project operations are restricted to the entity level.",
    keyDetails: [
      "Project cost tracking and budget comparison",
      "Time and expense capture against projects",
      "Project-based billing and invoice generation",
      "Resource utilization reporting",
      "Revenue recognition for project-based work",
      "Invoice generation, credit card transactions, and recurring transactions are entity-level in multi-base currency",
    ],
    relationships: [
      { targetId: "dimensions", type: "PART_OF" },
      { targetId: "general-ledger", type: "USED_BY" },
      { targetId: "accounts-receivable", type: "USED_BY" },
      { targetId: "budgets", type: "USED_BY" },
      { targetId: "multi-entity", type: "USED_BY" },
    ],
    category: "Core Financials",
  },
  {
    id: "user-roles",
    title: "User Roles & Permissions",
    summary:
      "Controls who can access what data and perform which actions within Sage Intacct.",
    whyItMatters:
      "Proper access controls are essential for financial security, compliance, and segregation of duties. Sage Intacct's role-based permissions system lets you define exactly what each user can see and do, from broad module access down to specific transaction types and entity restrictions. This is especially critical in multi-entity environments where users may need access to specific entities only.",
    keyDetails: [
      "Role-based access control with granular permissions",
      "Entity-level security restricts access to specific business units",
      "Segregation of duties enforcement",
      "Custom roles for unique organizational requirements",
      "Audit trail of user actions and changes",
      "Single sign-on (SSO) integration support",
    ],
    relationships: [
      { targetId: "multi-entity", type: "USED_BY" },
      { targetId: "general-ledger", type: "USED_BY" },
      { targetId: "accounts-payable", type: "USED_BY" },
      { targetId: "accounts-receivable", type: "USED_BY" },
    ],
    tasks: [
      "Create user roles",
      "Assign permissions",
      "Configure entity access",
      "Set up SSO",
    ],
    category: "Administration",
  },
  {
    id: "sage-ai",
    title: "Sage AI",
    summary:
      "AI-powered automation and intelligence features that enhance productivity across Sage Intacct.",
    whyItMatters:
      "Sage AI brings machine learning and automation to your everyday accounting workflows. From intelligent GL anomaly detection that flags unusual journal entries to automated data extraction and predictive insights, Sage AI helps your team work smarter, not harder. It's built into the platform so you can leverage AI without leaving your existing workflows.",
    keyDetails: [
      "Anomaly detection for journal entries using historical pattern analysis",
      "Automated data extraction for bill processing",
      "Predictive cash flow forecasting",
      "Intelligent coding suggestions for transaction entry",
      "Continuous learning from your organization's data",
      "Embedded directly in Sage Intacct workflows",
    ],
    relationships: [
      { targetId: "general-ledger", type: "EXTENDS" },
      { targetId: "accounts-payable", type: "EXTENDS" },
      { targetId: "financial-reporting", type: "EXTENDS" },
      { targetId: "journal-entries", type: "USED_BY" },
    ],
    category: "Administration",
  },
  {
    id: "platform-services",
    title: "Platform Services",
    summary:
      "The extensibility layer that enables custom applications, integrations, and workflows on Sage Intacct.",
    whyItMatters:
      "No two businesses are exactly alike, and Platform Services is how you make Sage Intacct fit your unique needs. Build custom objects, automate workflows, create custom reports, and integrate with third-party systems through the Sage Intacct API. This extensibility means your financial system can grow and adapt as your business evolves.",
    keyDetails: [
      "Custom objects for tracking business-specific data",
      "Workflow automation with triggers and actions",
      "REST and XML API for system integration",
      "Custom dashboards and reports",
      "Smart Events for real-time notifications",
      "Marketplace for pre-built integrations",
    ],
    relationships: [
      { targetId: "sage-ai", type: "EXTENDS" },
      { targetId: "general-ledger", type: "EXTENDS" },
      { targetId: "financial-reporting", type: "EXTENDS" },
      { targetId: "user-roles", type: "USED_BY" },
    ],
    category: "Administration",
  },
  {
    id: "order-entry",
    title: "Order Entry",
    summary:
      "Manages the full sales order lifecycle from quotation through fulfillment and invoicing.",
    whyItMatters:
      "Order Entry is the revenue engine for product-based businesses. It streamlines the quote-to-cash cycle by connecting sales orders to inventory, shipping, and invoicing. Sage Intacct's Order Entry module supports complex pricing rules, multi-step fulfillment, and automatic revenue recognition posting, reducing manual effort and accelerating cash collection.",
    keyDetails: [
      "Sales order creation with flexible line-item pricing",
      "Quotation management with conversion to sales orders",
      "Fulfillment tracking including partial shipments",
      "Automatic invoice generation from shipped orders",
      "Recurring order templates for repeat customers",
      "Integration with inventory for real-time availability checks",
      "Summarized OE revenue recognition entries to reduce GL volume",
      "Supports drop-ship and backorder workflows",
    ],
    relationships: [
      { targetId: "accounts-receivable", type: "USED_BY" },
      { targetId: "inventory-control", type: "REQUIRES" },
      { targetId: "revenue-recognition", type: "USED_BY" },
      { targetId: "general-ledger", type: "USED_BY" },
      { targetId: "dimensions", type: "USED_BY" },
    ],
    examples: [
      "Create a sales order and fulfill it with a partial shipment",
      "Convert a quotation to a sales order upon customer approval",
      "Generate invoices in batch for all shipped orders this week",
    ],
    tasks: [
      "Configure order entry transaction definitions",
      "Set up pricing rules and discount schedules",
      "Define fulfillment workflows",
      "Configure automatic invoicing",
    ],
    category: "Order Management",
  },
  {
    id: "fixed-assets",
    title: "Fixed Assets Management",
    summary:
      "Tracks the complete lifecycle of capital assets from acquisition through depreciation and disposal.",
    whyItMatters:
      "Fixed assets often represent a significant portion of an organization's balance sheet. Proper tracking ensures accurate financial statements, tax compliance, and informed capital planning. Sage Intacct automates depreciation calculations, supports multiple depreciation methods and books, and provides audit-ready asset registers that eliminate error-prone spreadsheet tracking.",
    keyDetails: [
      "Full asset lifecycle: acquisition, depreciation, transfer, disposal",
      "Multiple depreciation methods (straight-line, declining balance, daily, MACRS)",
      "Cumulative depreciation tracking at a glance",
      "Support for multiple depreciation books (GAAP, tax, IFRS)",
      "Bulk asset updates and state changes via import service",
      "Batch depreciation posting and bulk revert capabilities",
      "Journal posting rules for automated GL entries",
      "Historical asset import with manual or calculated accumulated depreciation",
    ],
    relationships: [
      { targetId: "general-ledger", type: "USED_BY" },
      { targetId: "accounts-payable", type: "USED_BY" },
      { targetId: "dimensions", type: "USED_BY" },
      { targetId: "financial-reporting", type: "USED_BY" },
    ],
    examples: [
      "Record a new office building and set up 39-year straight-line depreciation",
      "Run monthly depreciation posting for all asset categories",
      "Dispose of a fully depreciated vehicle and record the gain or loss",
    ],
    tasks: [
      "Set up asset categories and depreciation methods",
      "Import historical assets",
      "Run and post depreciation schedules",
      "Process asset disposals",
    ],
    category: "Asset Management",
  },
  {
    id: "time-expenses",
    title: "Time & Expenses",
    summary:
      "Captures employee time and expense data for project costing, payroll, and client billing.",
    whyItMatters:
      "Accurate time and expense tracking is critical for professional services firms and any project-based organization. Sage Intelligent Time provides customizable timesheet grids, automated overtime calculations, and leave management. Time data flows directly into project costing, payroll processing, and client billing, eliminating double entry and ensuring every billable hour is captured.",
    keyDetails: [
      "Customizable timesheet entry grid for flexible time capture",
      "Automatic overtime calculation rules for payroll and project billing",
      "Employee leave management with approval workflows",
      "Time entry against projects, tasks, and customers",
      "Expense report creation with receipt attachment",
      "Approval routing for timesheets and expense reports",
      "Integration with project billing for client invoicing",
      "Credit card transaction linking to expense reports",
    ],
    relationships: [
      { targetId: "projects", type: "USED_BY" },
      { targetId: "accounts-payable", type: "USED_BY" },
      { targetId: "general-ledger", type: "USED_BY" },
      { targetId: "dimensions", type: "USED_BY" },
      { targetId: "employee-expenses", type: "EXTENDS" },
    ],
    examples: [
      "Submit a weekly timesheet with hours split across three projects",
      "Configure overtime rules for hourly employees",
      "Track employee leave balances and approval workflows",
    ],
    tasks: [
      "Configure timesheet entry grid",
      "Set up overtime rules",
      "Enable leave management",
      "Define approval workflows",
    ],
    category: "Time & Expenses",
  },
  {
    id: "employee-expenses",
    title: "Employee Expenses",
    summary:
      "Manages employee expense reports, reimbursement policies, and approval workflows.",
    whyItMatters:
      "Employee expense management directly impacts both your financial accuracy and employee satisfaction. Sage Intacct streamlines the process from expense submission through approval and reimbursement, enforcing spending policies automatically. Linking credit card transactions and electronic receipts to expense reports reduces manual data entry and ensures every expense is properly documented.",
    keyDetails: [
      "Expense report creation with category-based coding",
      "Credit card transaction linking with electronic receipts",
      "Configurable expense policies and spending limits",
      "Multi-level approval workflows",
      "Mileage and per-diem calculation support",
      "Reimbursement processing through AP",
      "Dimension tagging for departmental cost allocation",
      "Mobile receipt capture capabilities",
    ],
    relationships: [
      { targetId: "accounts-payable", type: "USED_BY" },
      { targetId: "general-ledger", type: "USED_BY" },
      { targetId: "projects", type: "USED_BY" },
      { targetId: "dimensions", type: "USED_BY" },
      { targetId: "time-expenses", type: "PART_OF" },
    ],
    examples: [
      "Submit a travel expense report with linked credit card charges",
      "Set a $50 daily meal limit for business travel expenses",
      "Auto-link electronic receipts to credit card transactions",
    ],
    tasks: [
      "Define expense categories and policies",
      "Set up approval workflows",
      "Configure credit card feeds",
      "Set reimbursement schedules",
    ],
    category: "Time & Expenses",
  },
  {
    id: "tax-management",
    title: "Tax Management",
    summary:
      "Configures and automates sales tax, use tax, VAT, and other tax calculations across transactions.",
    whyItMatters:
      "Tax compliance is one of the most complex aspects of financial management, especially for organizations operating across multiple jurisdictions. Sage Intacct's tax engine automates tax calculations on invoices, bills, and orders, supports region-specific VAT schemes, and generates the reports needed for filing. Custom tax reports for France, Germany, New Zealand, Singapore, and the UK reduce the burden of multi-country compliance.",
    keyDetails: [
      "Automated tax calculation on sales and purchase transactions",
      "Support for sales tax, use tax, VAT, and GST",
      "Tax group configuration for complex multi-jurisdiction scenarios",
      "Region-specific custom reports (France, Germany, UK, NZ, Singapore)",
      "DATEV and GoBD export support for German compliance",
      "Group VAT filing support for UK and France",
      "Tax-inclusive and tax-exclusive pricing options",
      "Reporting account filters for specialized tax exports",
    ],
    relationships: [
      { targetId: "accounts-payable", type: "USED_BY" },
      { targetId: "accounts-receivable", type: "USED_BY" },
      { targetId: "order-entry", type: "USED_BY" },
      { targetId: "general-ledger", type: "USED_BY" },
      { targetId: "multi-entity", type: "USED_BY" },
    ],
    examples: [
      "Configure VAT rates for UK and EU transactions",
      "Generate a DATEV export for German tax authorities",
      "Set up use tax for out-of-state purchases in the US",
    ],
    tasks: [
      "Configure tax schedules and rates",
      "Set up tax groups for multi-jurisdiction",
      "Enable region-specific tax reports",
      "Configure tax-inclusive pricing",
    ],
    category: "Tax & Compliance",
  },
  {
    id: "allocations",
    title: "Allocations",
    summary:
      "Distributes costs and revenues across departments, locations, or other dimensions based on configurable rules.",
    whyItMatters:
      "Many shared costs (rent, IT, management overhead) need to be allocated to the departments or projects that benefit from them. Sage Intacct's allocation engine automates this process using configurable rules, ensuring consistent and auditable cost distribution. This is essential for accurate departmental profitability analysis and internal cost management.",
    keyDetails: [
      "Rule-based cost allocation across dimensions",
      "Percentage-based and statistical allocation methods",
      "Support for multi-step allocation cascades",
      "Scheduled allocation runs for period-end processing",
      "Allocation journal entries posted automatically to GL",
      "Reversal support for correcting allocation errors",
      "Allocation reporting for audit and review",
    ],
    relationships: [
      { targetId: "general-ledger", type: "USED_BY" },
      { targetId: "dimensions", type: "REQUIRES" },
      { targetId: "financial-reporting", type: "USED_BY" },
      { targetId: "budgets", type: "USED_BY" },
    ],
    examples: [
      "Allocate shared office rent across departments by headcount",
      "Distribute IT costs to business units based on usage metrics",
      "Run month-end allocations as part of the close process",
    ],
    tasks: [
      "Define allocation rules and bases",
      "Set up allocation schedules",
      "Review allocation results",
      "Configure cascade allocations",
    ],
    category: "Core Financials",
  },
  {
    id: "landed-costs",
    title: "Landed Costs",
    summary:
      "Calculates the true total cost of inventory by factoring in freight, customs, insurance, and other charges.",
    whyItMatters:
      "The purchase price of inventory is only part of the story. Freight, customs duties, insurance, handling fees, and other costs all affect your true cost of goods. Sage Intacct's Landed Costs feature lets you accurately capture and allocate these additional costs to inventory items, ensuring your gross margins and inventory valuations reflect reality.",
    keyDetails: [
      "Captures freight, customs, insurance, and handling charges",
      "Allocates costs to inventory items by weight, value, or quantity",
      "Supports multiple cost components per receipt",
      "Updates inventory valuation with true landed cost",
      "Integration with purchasing and inventory modules",
      "Reporting on landed cost components for cost analysis",
    ],
    relationships: [
      { targetId: "inventory-control", type: "EXTENDS" },
      { targetId: "purchasing", type: "USED_BY" },
      { targetId: "accounts-payable", type: "USED_BY" },
      { targetId: "general-ledger", type: "USED_BY" },
    ],
    examples: [
      "Add ocean freight and customs duty to an import shipment",
      "Allocate container shipping costs across items by weight",
      "Compare landed cost to selling price for margin analysis",
    ],
    tasks: [
      "Define landed cost types",
      "Configure allocation methods",
      "Apply landed costs to receipts",
      "Review cost impact reports",
    ],
    category: "Order Management",
  },
  {
    id: "smart-events",
    title: "Smart Events",
    summary:
      "Automated notification triggers that alert users when specific conditions are met across the system.",
    whyItMatters:
      "Proactive notifications prevent issues from slipping through the cracks. Smart Events monitor your data continuously and trigger alerts when conditions you define are met - such as when a customer exceeds their credit limit, a budget threshold is crossed, or an approval has been pending too long. This transforms Sage Intacct from a passive record keeper into an active business advisor.",
    keyDetails: [
      "Configurable event triggers based on transaction conditions",
      "Email and in-app notification delivery",
      "Support for threshold-based alerts (amounts, dates, quantities)",
      "Integration with workflow automation",
      "Scheduled event evaluation for periodic checks",
      "Custom event definitions for unique business rules",
    ],
    relationships: [
      { targetId: "platform-services", type: "PART_OF" },
      { targetId: "accounts-payable", type: "USED_BY" },
      { targetId: "accounts-receivable", type: "USED_BY" },
      { targetId: "general-ledger", type: "USED_BY" },
    ],
    examples: [
      "Alert the CFO when any journal entry exceeds $100,000",
      "Notify the collections team when an invoice is 30 days past due",
      "Trigger an email when a budget line is 90% consumed",
    ],
    tasks: [
      "Define event conditions and triggers",
      "Configure notification recipients",
      "Set evaluation schedules",
      "Test and activate events",
    ],
    category: "Administration",
  },
  {
    id: "ap-automation",
    title: "AP Automation",
    summary:
      "AI-powered automation for processing vendor bills, matching documents, and routing approvals.",
    whyItMatters:
      "Manual bill processing is slow, error-prone, and expensive. AP Automation uses AI to extract data from bills, match them to purchase orders at the line level, and route them through approval workflows automatically. This dramatically reduces the time from bill receipt to payment while improving accuracy and compliance. Support for email forwarding and inline attachment processing means bills flow into the system from any source.",
    keyDetails: [
      "AI-powered data extraction from vendor bills",
      "Line-level document matching with purchase orders",
      "Automated transactions without matching for non-PO invoices",
      "Email auto-forwarding with inline attachment processing",
      "Match tolerance exception visibility and override controls",
      "Approval delegation for out-of-office workflows",
      "Support for ZUGFeRD format bills (Germany)",
      "Integration with Purchasing for three-way matching",
    ],
    relationships: [
      { targetId: "accounts-payable", type: "EXTENDS" },
      { targetId: "purchasing", type: "REQUIRES" },
      { targetId: "sage-ai", type: "PART_OF" },
      { targetId: "vendors", type: "USED_BY" },
    ],
    examples: [
      "Auto-extract bill data from an emailed PDF invoice",
      "Match a vendor invoice to PO lines with tolerance checking",
      "Delegate bill approvals when the approver is on vacation",
    ],
    tasks: [
      "Configure AP Automation rules",
      "Set up email forwarding",
      "Define match tolerance thresholds",
      "Enable approval delegation",
    ],
    category: "Accounts Payable",
  },
  {
    id: "dashboards",
    title: "Dashboards & Analytics",
    summary:
      "Real-time visual dashboards providing at-a-glance financial and operational insights.",
    whyItMatters:
      "Executives and managers need quick access to KPIs without digging through reports. Sage Intacct's dashboards aggregate data from across all modules into configurable visual displays, providing real-time visibility into cash position, revenue trends, expense patterns, and more. Interactive Visual Explorer (IVE) extends this with rich data visualization capabilities.",
    keyDetails: [
      "Configurable dashboard widgets for key metrics",
      "Real-time data refresh from live transactions",
      "Interactive Visual Explorer (IVE) for rich data visualization",
      "ICRW (Interactive Custom Report Writer) for advanced reporting",
      "Role-based dashboard views for different users",
      "Drill-down from dashboard metrics to source transactions",
      "SaaS Intelligence for subscription analytics",
    ],
    relationships: [
      { targetId: "financial-reporting", type: "EXTENDS" },
      { targetId: "general-ledger", type: "REQUIRES" },
      { targetId: "dimensions", type: "REQUIRES" },
      { targetId: "budgets", type: "USED_BY" },
    ],
    examples: [
      "Build a CFO dashboard with cash position, burn rate, and revenue trends",
      "Use IVE to create a visual breakdown of expenses by department",
      "Set up a subscription churn analysis with SaaS Intelligence",
    ],
    tasks: [
      "Configure dashboard layouts",
      "Create IVE visualizations",
      "Set up role-based views",
      "Build ICRW custom reports",
    ],
    category: "Reporting",
  },
  {
    id: "vendor-payments",
    title: "Vendor Payments",
    summary:
      "Streamlined payment processing powered by MineralTree for paying vendor bills directly within Sage Intacct.",
    whyItMatters:
      "Getting payments out the door efficiently while maintaining controls is a constant challenge. Vendor Payments powered by MineralTree embeds payment processing directly within Sage Intacct, working with your existing AP workflow. This eliminates the need for separate payment platforms, reduces check fraud risk, and accelerates the procure-to-pay cycle.",
    keyDetails: [
      "Embedded payment processing within Sage Intacct",
      "Support for ACH, check, and virtual card payments",
      "Automatic payment reconciliation with AP records",
      "Payment approval workflows and controls",
      "Vendor payment status tracking",
      "Pay bills directly from the vendor list",
      "NACHA file format support for ACH payments",
    ],
    relationships: [
      { targetId: "accounts-payable", type: "EXTENDS" },
      { targetId: "vendors", type: "REQUIRES" },
      { targetId: "cash-management", type: "USED_BY" },
      { targetId: "bank-reconciliation", type: "USED_BY" },
    ],
    examples: [
      "Process a batch ACH payment for all approved bills due this week",
      "Pay a vendor bill directly from the vendor record",
      "Generate NACHA files for bank ACH processing",
    ],
    tasks: [
      "Set up MineralTree integration",
      "Configure payment methods",
      "Define payment approval workflows",
      "Enable vendor self-service",
    ],
    category: "Accounts Payable",
  },
  {
    id: "construction",
    title: "Construction & Projects",
    summary:
      "Specialized project accounting for construction including WIP management, change orders, and project contracts.",
    whyItMatters:
      "Construction companies have unique financial needs - work-in-progress schedules, change orders, retainage, and cost-to-complete forecasting. Sage Intacct's construction features extend the core Projects module with specialized tools for WIP management, change request tracking, and project contract billing. Primary estimate forecasts and bulk standard task assignment streamline project setup and management.",
    keyDetails: [
      "Work in progress (WIP) schedule management",
      "Project cost forecasting with customizable detail levels",
      "Change request import and entry line management",
      "Standard task catalogs with bulk Add to Project actions",
      "Project contract billing with customer flexibility",
      "Primary document summaries on PO templates",
      "Subtotal tracking on purchasing change orders",
      "Enhanced construction reporting in ICRW library",
    ],
    relationships: [
      { targetId: "projects", type: "EXTENDS" },
      { targetId: "accounts-receivable", type: "USED_BY" },
      { targetId: "purchasing", type: "USED_BY" },
      { targetId: "revenue-recognition", type: "USED_BY" },
    ],
    examples: [
      "Generate a WIP schedule at your preferred cost detail level",
      "Import change requests in bulk through the list view",
      "Mark an estimate as the primary forecast for quick access",
    ],
    tasks: [
      "Set up WIP schedules",
      "Configure change request workflows",
      "Define standard task catalogs",
      "Set up project contract billing",
    ],
    category: "Core Financials",
  },
  {
    id: "sage-copilot",
    title: "Sage Copilot",
    summary:
      "AI-powered assistant and close workspace that helps standardize processes and surface intelligent insights.",
    whyItMatters:
      "Sage Copilot represents the future of AI-assisted accounting. The Close Workspace feature standardizes your close process with repeatable, trackable workflows, ensuring nothing falls through the cracks. AI-powered semantic search understands the context of your help queries, and Close Automation delivers a suite of tools for a smoother, faster period-end close.",
    keyDetails: [
      "Close Workspace for standardized close processes",
      "Close Automation for streamlined period-end workflows",
      "AI-powered semantic search for help content",
      "Context-aware assistance within Sage Intacct",
      "Repeatable and trackable close task workflows",
      "Available in all English-speaking regions",
    ],
    relationships: [
      { targetId: "sage-ai", type: "PART_OF" },
      { targetId: "close-workspace", type: "PART_OF" },
      { targetId: "general-ledger", type: "USED_BY" },
      { targetId: "financial-reporting", type: "USED_BY" },
      { targetId: "platform-services", type: "EXTENDS" },
    ],
    examples: [
      "Use Close Workspace to track all month-end close tasks",
      "Search help using natural language questions",
      "Automate recurring close checklist items",
    ],
    tasks: [
      "Enable Sage Copilot",
      "Configure close workspace tasks",
      "Set up close automation rules",
      "Train team on AI-powered search",
    ],
    category: "Administration",
  },
  {
    id: "close-books",
    title: "Close Books",
    summary:
      "Locks the books through a selected reporting period so users cannot post transactions dated on or before that end date.",
    whyItMatters:
      "Closing books is the control that turns a period from “still editable” into “final for posting.” Without it, late entries can silently rewrite numbers you already reported. In Sage Intacct, closing a later period also closes any still-open preceding periods.",
    keyDetails: [
      "Path: General Ledger > All > Books > Close",
      "Requires General Ledger: Close books permission",
      "Prevents posting for dates prior to the selected end of period",
      "Closing a subsequent period closes preceding open periods automatically",
      "Custom reporting periods can shift the effective accounting-period close date",
      "Adjustments after close use the adjustment journal, not ordinary journals",
      "Locked periods must be unlocked before they can be reopened",
    ],
    relationships: [
      { targetId: "general-ledger", type: "PART_OF" },
      { targetId: "reporting-periods", type: "REQUIRES" },
      { targetId: "journal-entries", type: "CONTRASTS_WITH" },
      { targetId: "close-workspace", type: "USED_BY" },
      { targetId: "financial-reporting", type: "USED_BY" },
    ],
    examples: [
      "Close books through the prior fiscal month before publishing statements",
      "Close Q3 and automatically close any still-open months in Q2",
      "Reopen books briefly to fix an unintentional close, then close again",
    ],
    tasks: [
      "Confirm reporting periods exist for the period you want to close",
      "Close books through the target period",
      "Verify users can no longer post into the closed range",
    ],
    category: "Core Financials",
  },
  {
    id: "reporting-periods",
    title: "Reporting Periods",
    summary:
      "Named date ranges used for closing books, running reports, and aligning custom calendars with accounting periods.",
    whyItMatters:
      "Close and reporting both hang on which period you select. If the period is missing or misaligned with your accounting calendar, the close date and report windows will not match what controllers expect.",
    keyDetails: [
      "System periods (month, quarter, year) plus custom periods",
      "Required when closing books via “To the end of period”",
      "Used across financial reports and performance cards",
      "Custom periods may not end on the last day of an accounting period",
      "Can be listed, created, and managed in Reporting setup",
    ],
    relationships: [
      { targetId: "close-books", type: "USED_BY" },
      { targetId: "financial-reporting", type: "USED_BY" },
      { targetId: "general-ledger", type: "USED_BY" },
      { targetId: "dashboards", type: "USED_BY" },
    ],
    examples: [
      "Add a missing month period before month-end close",
      "Use a custom week period for operational reporting",
      "Select Current month on a financial report",
    ],
    tasks: [
      "List standard and custom reporting periods",
      "Create a reporting period needed for close",
      "Confirm period end dates against the accounting calendar",
    ],
    category: "Reporting",
  },
  {
    id: "close-workspace",
    title: "Close Workspace",
    summary:
      "Copilot Close Automation workspace: a trackable checklist of period-end tasks leading up to closing the books.",
    whyItMatters:
      "“Close the books” is one GL action; period close is a job. Close Workspace is the curriculum and control list for that job—bank rec, subledgers, allocations, reviews—so the lock button is the last step, not the only step.",
    keyDetails: [
      "Part of Sage Copilot Close Automation",
      "Task templates for repeatable month-end workflows",
      "Tracks ownership and status of close tasks",
      "Complements—not replaces—the GL Close Books page",
      "Useful for controllers standardizing multi-person close",
    ],
    relationships: [
      { targetId: "sage-copilot", type: "PART_OF" },
      { targetId: "close-books", type: "EXTENDS" },
      { targetId: "bank-reconciliation", type: "REQUIRES" },
      { targetId: "accounts-payable", type: "REQUIRES" },
      { targetId: "accounts-receivable", type: "REQUIRES" },
      { targetId: "allocations", type: "REQUIRES" },
      { targetId: "financial-reporting", type: "USED_BY" },
    ],
    examples: [
      "Run Close Workspace as the month-end checklist before locking books",
      "Assign AP and cash tasks to specialists inside the workspace",
      "Customize system-generated task templates for your close calendar",
    ],
    tasks: [
      "Open Close Workspace for the current period",
      "Complete checklist tasks before Close Books",
      "Customize task templates for your entity",
    ],
    category: "Core Financials",
  },
];
