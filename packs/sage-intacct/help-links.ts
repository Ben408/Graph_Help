// Help URLs and hierarchy data for Sage Intacct concepts
// This maps concept IDs to their canonical help center pages and navigation hierarchy

export interface HelpLinkData {
  helpUrl: string;
  hierarchy: {
    parent: string;
    breadcrumb: string[];
  };
}

// Base URL for Sage Intacct Help Center
export const SAGE_HELP_BASE_URL =
  "https://www.intacct.com/ia/docs/en_US/help_action";

// Search URL for Sage Help Center (append query string)
export const SAGE_HELP_SEARCH_URL =
  "https://www.intacct.com/ia/docs/en_US/help_action/Default.htm#t=Search%2FSearch.htm&rhsearch=";

// Release notes base URL
export const SAGE_RELEASE_NOTES_URL =
  "https://www.intacct.com/ia/docs/en_US/releasenotes";

export const helpLinks: Record<string, HelpLinkData> = {
  "general-ledger": {
    helpUrl: `${SAGE_HELP_BASE_URL}/General_Ledger/General_Ledger.htm`,
    hierarchy: {
      parent: "Core Financials",
      breadcrumb: ["Sage Intacct", "Core Financials", "General Ledger"],
    },
  },
  "chart-of-accounts": {
    helpUrl: `${SAGE_HELP_BASE_URL}/General_Ledger/GL_accounts/GL_account_setup.htm`,
    hierarchy: {
      parent: "General Ledger",
      breadcrumb: [
        "Sage Intacct",
        "Core Financials",
        "General Ledger",
        "Chart of Accounts",
      ],
    },
  },
  "journal-entries": {
    helpUrl: `${SAGE_HELP_BASE_URL}/General_Ledger/Journal_entries/journal_entries_overview.htm`,
    hierarchy: {
      parent: "General Ledger",
      breadcrumb: [
        "Sage Intacct",
        "Core Financials",
        "General Ledger",
        "Journal Entries",
      ],
    },
  },
  dimensions: {
    helpUrl: `${SAGE_HELP_BASE_URL}/Company/Dimensions/dimensions_overview.htm`,
    hierarchy: {
      parent: "Company Setup",
      breadcrumb: ["Sage Intacct", "Company Setup", "Dimensions"],
    },
  },
  budgets: {
    helpUrl: `${SAGE_HELP_BASE_URL}/General_Ledger/Budgeting/budgets_overview.htm`,
    hierarchy: {
      parent: "General Ledger",
      breadcrumb: [
        "Sage Intacct",
        "Core Financials",
        "General Ledger",
        "Budgets",
      ],
    },
  },
  "accounts-payable": {
    helpUrl: `${SAGE_HELP_BASE_URL}/Accounts_Payable/accounts_payable.htm`,
    hierarchy: {
      parent: "Accounts Payable",
      breadcrumb: ["Sage Intacct", "Accounts Payable"],
    },
  },
  vendors: {
    helpUrl: `${SAGE_HELP_BASE_URL}/Accounts_Payable/Vendors/vendors_overview.htm`,
    hierarchy: {
      parent: "Accounts Payable",
      breadcrumb: ["Sage Intacct", "Accounts Payable", "Vendors"],
    },
  },
  purchasing: {
    helpUrl: `${SAGE_HELP_BASE_URL}/Purchasing/purchasing_overview.htm`,
    hierarchy: {
      parent: "Purchasing",
      breadcrumb: ["Sage Intacct", "Purchasing"],
    },
  },
  "accounts-receivable": {
    helpUrl: `${SAGE_HELP_BASE_URL}/Accounts_Receivable/accounts_receivable.htm`,
    hierarchy: {
      parent: "Accounts Receivable",
      breadcrumb: ["Sage Intacct", "Accounts Receivable"],
    },
  },
  contracts: {
    helpUrl: `${SAGE_HELP_BASE_URL}/Contracts/contracts_overview.htm`,
    hierarchy: {
      parent: "Revenue Management",
      breadcrumb: ["Sage Intacct", "Revenue Management", "Contracts"],
    },
  },
  "cash-management": {
    helpUrl: `${SAGE_HELP_BASE_URL}/Cash_Management/cash_management.htm`,
    hierarchy: {
      parent: "Cash Management",
      breadcrumb: ["Sage Intacct", "Cash Management"],
    },
  },
  "bank-reconciliation": {
    helpUrl: `${SAGE_HELP_BASE_URL}/Cash_Management/Bank_reconciliation/bank_reconciliation.htm`,
    hierarchy: {
      parent: "Cash Management",
      breadcrumb: ["Sage Intacct", "Cash Management", "Bank Reconciliation"],
    },
  },
  "multi-entity": {
    helpUrl: `${SAGE_HELP_BASE_URL}/Multi-entity/multi-entity_overview.htm`,
    hierarchy: {
      parent: "Multi-Entity",
      breadcrumb: ["Sage Intacct", "Multi-Entity Management"],
    },
  },
  "multi-currency": {
    helpUrl: `${SAGE_HELP_BASE_URL}/Multi-currency/multi-currency_overview.htm`,
    hierarchy: {
      parent: "Multi-Entity",
      breadcrumb: ["Sage Intacct", "Multi-Entity Management", "Multi-Currency"],
    },
  },
  consolidation: {
    helpUrl: `${SAGE_HELP_BASE_URL}/Consolidation/consolidation_overview.htm`,
    hierarchy: {
      parent: "Multi-Entity",
      breadcrumb: ["Sage Intacct", "Multi-Entity Management", "Consolidation"],
    },
  },
  "financial-reporting": {
    helpUrl: `${SAGE_HELP_BASE_URL}/Reporting/reporting_overview.htm`,
    hierarchy: {
      parent: "Reporting",
      breadcrumb: ["Sage Intacct", "Reporting"],
    },
  },
  "revenue-recognition": {
    helpUrl: `${SAGE_HELP_BASE_URL}/Revenue_Recognition/revenue_recognition_overview.htm`,
    hierarchy: {
      parent: "Revenue Management",
      breadcrumb: ["Sage Intacct", "Revenue Management", "Revenue Recognition"],
    },
  },
  "user-roles": {
    helpUrl: `${SAGE_HELP_BASE_URL}/Company/Security/users_permissions_overview.htm`,
    hierarchy: {
      parent: "Administration",
      breadcrumb: [
        "Sage Intacct",
        "Administration",
        "User Roles & Permissions",
      ],
    },
  },
  "sage-ai": {
    helpUrl: `${SAGE_HELP_BASE_URL}/Intelligent_GL/intelligent_gl_overview.htm`,
    hierarchy: {
      parent: "Administration",
      breadcrumb: ["Sage Intacct", "Administration", "Sage AI"],
    },
  },
  "platform-services": {
    helpUrl: `${SAGE_HELP_BASE_URL}/Platform_Services/platform_services_overview.htm`,
    hierarchy: {
      parent: "Administration",
      breadcrumb: ["Sage Intacct", "Administration", "Platform Services"],
    },
  },
  projects: {
    helpUrl: `${SAGE_HELP_BASE_URL}/Projects/projects_overview.htm`,
    hierarchy: {
      parent: "Projects",
      breadcrumb: ["Sage Intacct", "Projects"],
    },
  },
  "inventory-control": {
    helpUrl: `${SAGE_HELP_BASE_URL}/Inventory_Control/inventory_control_overview.htm`,
    hierarchy: {
      parent: "Inventory",
      breadcrumb: ["Sage Intacct", "Inventory Control"],
    },
  },
  "order-entry": {
    helpUrl: `${SAGE_HELP_BASE_URL}/Order_Entry/order_entry_overview.htm`,
    hierarchy: {
      parent: "Order Management",
      breadcrumb: ["Sage Intacct", "Order Management", "Order Entry"],
    },
  },
  "fixed-assets": {
    helpUrl: `${SAGE_HELP_BASE_URL}/Fixed_Assets/fixed_assets_overview.htm`,
    hierarchy: {
      parent: "Fixed Assets",
      breadcrumb: ["Sage Intacct", "Fixed Assets"],
    },
  },
  "time-expenses": {
    helpUrl: `${SAGE_HELP_BASE_URL}/Time_Expenses/time_and_expenses_overview.htm`,
    hierarchy: {
      parent: "Time & Expenses",
      breadcrumb: ["Sage Intacct", "Time & Expenses"],
    },
  },
  "employee-expenses": {
    helpUrl: `${SAGE_HELP_BASE_URL}/Employee_Expenses/employee_expenses_overview.htm`,
    hierarchy: {
      parent: "Time & Expenses",
      breadcrumb: ["Sage Intacct", "Time & Expenses", "Employee Expenses"],
    },
  },
  "tax-management": {
    helpUrl: `${SAGE_HELP_BASE_URL}/Tax/tax_overview.htm`,
    hierarchy: {
      parent: "Tax & Compliance",
      breadcrumb: ["Sage Intacct", "Tax & Compliance", "Tax Management"],
    },
  },
  allocations: {
    helpUrl: `${SAGE_HELP_BASE_URL}/General_Ledger/Allocations/allocations_overview.htm`,
    hierarchy: {
      parent: "General Ledger",
      breadcrumb: [
        "Sage Intacct",
        "Core Financials",
        "General Ledger",
        "Allocations",
      ],
    },
  },
  "landed-costs": {
    helpUrl: `${SAGE_HELP_BASE_URL}/Inventory_Control/Landed_costs/landed_costs_overview.htm`,
    hierarchy: {
      parent: "Inventory Control",
      breadcrumb: ["Sage Intacct", "Inventory Control", "Landed Costs"],
    },
  },
  "smart-events": {
    helpUrl: `${SAGE_HELP_BASE_URL}/Platform_Services/Smart_Events/smart_events_overview.htm`,
    hierarchy: {
      parent: "Platform Services",
      breadcrumb: [
        "Sage Intacct",
        "Administration",
        "Platform Services",
        "Smart Events",
      ],
    },
  },
  "ap-automation": {
    helpUrl: `${SAGE_HELP_BASE_URL}/AP_Automation/ap_automation_overview.htm`,
    hierarchy: {
      parent: "Accounts Payable",
      breadcrumb: ["Sage Intacct", "Accounts Payable", "AP Automation"],
    },
  },
  dashboards: {
    helpUrl: `${SAGE_HELP_BASE_URL}/Reporting/Dashboards/dashboards_overview.htm`,
    hierarchy: {
      parent: "Reporting",
      breadcrumb: ["Sage Intacct", "Reporting", "Dashboards & Analytics"],
    },
  },
  "vendor-payments": {
    helpUrl: `${SAGE_HELP_BASE_URL}/Accounts_Payable/Vendor_Payments/vendor_payments_overview.htm`,
    hierarchy: {
      parent: "Accounts Payable",
      breadcrumb: ["Sage Intacct", "Accounts Payable", "Vendor Payments"],
    },
  },
  construction: {
    helpUrl: `${SAGE_HELP_BASE_URL}/Construction/construction_overview.htm`,
    hierarchy: {
      parent: "Construction",
      breadcrumb: ["Sage Intacct", "Construction & Projects"],
    },
  },
  "sage-copilot": {
    helpUrl: `${SAGE_HELP_BASE_URL}/Sage_Copilot/sage_copilot_overview.htm`,
    hierarchy: {
      parent: "Administration",
      breadcrumb: ["Sage Intacct", "Administration", "Sage Copilot"],
    },
  },
  "close-books": {
    helpUrl: `${SAGE_HELP_BASE_URL}/General_Ledger/Open_and_close_books/close-books.htm`,
    hierarchy: {
      parent: "General Ledger",
      breadcrumb: [
        "Sage Intacct",
        "Core Financials",
        "General Ledger",
        "Close Books",
      ],
    },
  },
  "reporting-periods": {
    helpUrl: `${SAGE_HELP_BASE_URL}/Reporting/Setup/Reporting_periods/about-reporting-periods.htm`,
    hierarchy: {
      parent: "Reporting",
      breadcrumb: ["Sage Intacct", "Reporting", "Reporting Periods"],
    },
  },
  "close-workspace": {
    helpUrl: `${SAGE_HELP_BASE_URL}/Copilot/Close_Automation/Close_workspace/aa-toc-close-workspace.htm`,
    hierarchy: {
      parent: "Sage Copilot",
      breadcrumb: [
        "Sage Intacct",
        "Administration",
        "Sage Copilot",
        "Close Workspace",
      ],
    },
  },
};

// Get help link data for a concept
export function getHelpLinkData(conceptId: string): HelpLinkData | undefined {
  return helpLinks[conceptId];
}

// Build the full help URL for searching
export function buildSageSearchUrl(query: string): string {
  return `${SAGE_HELP_SEARCH_URL}${encodeURIComponent(query)}`;
}
