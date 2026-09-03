"""Resolve pack concept ids for Help pages during OKF convert."""

from __future__ import annotations

from urllib.parse import urlparse

from src.knowledge.pack_loader import load_pack

# Prefer precise page matches over broad module maps (reduces Allocations/Budgets noise).
# Path fragments from the current Help tree (2026 R3 ingest). Order is first-match.
PAGE_OVERRIDES: list[tuple[str, list[str]]] = [
    ("/Open_and_close_books/close-books", ["close-books", "general-ledger"]),
    ("/Open_and_close_books/open-books", ["close-books", "general-ledger"]),
    ("/Open_and_close_books/open-and-close-process", ["close-books", "general-ledger"]),
    ("/Open_and_close_books/", ["close-books", "general-ledger"]),
    ("/Reporting_periods/", ["reporting-periods", "financial-reporting"]),
    ("/reporting-periods", ["reporting-periods", "financial-reporting"]),
    ("/Adjustments_to_closed_books/", ["close-books", "journal-entries", "general-ledger"]),
    ("/Close_Automation/", ["close-workspace", "sage-copilot"]),
    ("/Close_workspace/", ["close-workspace", "sage-copilot"]),
    ("/Copilot/get-to-know-sage-ai", ["sage-ai", "sage-copilot"]),
    ("/Allocations/", ["allocations", "general-ledger"]),
    ("/Budgets_and_spending/", ["budgets", "general-ledger"]),
    ("/General_Ledger/Setup/Accounts/", ["chart-of-accounts", "general-ledger"]),
    ("/Chart_of_accounts/", ["chart-of-accounts", "general-ledger"]),
    ("/Journal_entries/", ["journal-entries", "general-ledger"]),
    ("/Journal_Entries/", ["journal-entries", "general-ledger"]),
    ("/Cash_Management/Reconcile/", ["bank-reconciliation", "cash-management"]),
    ("/Reporting/Dimensions/", ["dimensions"]),
    ("/Company/Dimensions/", ["dimensions"]),
    ("/Accounts_Payable/Setup/Vendors/", ["vendors", "accounts-payable"]),
    ("/Accounts_Payable/Automation/", ["ap-automation", "accounts-payable"]),
    ("/Accounts_Payable/Payments/", ["vendor-payments", "accounts-payable"]),
    ("/Administration/Permissions/", ["user-roles"]),
    ("/Administration/Users/", ["user-roles"]),
    ("/Customization_and_Platform_Services/Smart_Events/", ["smart-events", "platform-services"]),
    ("/Customization_and_Platform_Services/", ["platform-services"]),
    ("/Expenses/Employee_expense", ["employee-expenses"]),
    ("/Sage_Intelligent_Time/", ["time-expenses"]),
    ("/Taxes/", ["tax-management"]),
    ("/Currencies_and_exchange_rates/", ["multi-currency"]),
    ("/Multi-entity/", ["multi-entity"]),
    ("/Reporting/Dashboards/", ["dashboards", "financial-reporting"]),
    ("/Fixed_Assets/", ["fixed-assets"]),
    ("/Landed_costs/", ["landed-costs"]),
    ("/Inventory_Control/", ["inventory-control"]),
    ("/help_action/Projects/", ["projects"]),
    ("/help_action/Consolidations/", ["consolidation"]),
    ("/help_action/Construction/", ["construction"]),
    ("/Revenue_Management/", ["revenue-recognition"]),
]

# Primary noun owns each path; used when YAML stamps are missing.
CONCEPT_PATH_FRAGMENTS: dict[str, list[str]] = {}
for _fragment, _ids in PAGE_OVERRIDES:
    if _ids:
        CONCEPT_PATH_FRAGMENTS.setdefault(_ids[0], []).append(_fragment)


TITLE_OVERRIDES: list[tuple[str, list[str]]] = [
    ("close books", ["close-books", "general-ledger"]),
    ("open books", ["close-books", "general-ledger"]),
    ("reporting period", ["reporting-periods", "financial-reporting"]),
    ("close workspace", ["close-workspace", "sage-copilot"]),
    ("close automation", ["close-workspace", "sage-copilot"]),
]


def resolve_pack_concept_ids(
    *,
    page_url: str,
    title: str = "",
    heading_path: str = "",
    module: str = "",
) -> list[str]:
    """Return ordered unique pack concept ids that apply to this Help page/section."""
    pack = load_pack()
    known = {str(n.get("id")) for n in pack.get("vocabulary") or [] if n.get("id")}
    path = urlparse(page_url).path
    blob = f"{title} {heading_path}".lower()
    ids: list[str] = []

    def add(candidates: list[str]) -> None:
        for ident in candidates:
            if ident in known and ident not in ids:
                ids.append(ident)

    for fragment, concept_ids in PAGE_OVERRIDES:
        if fragment in path:
            add(concept_ids)
            return ids

    for needle, concept_ids in TITLE_OVERRIDES:
        if needle in blob:
            add(concept_ids)
            return ids

    # Module map is coarse — use primary module concept only when stamping OKF.
    for mapping in pack.get("moduleMap") or []:
        mapped_module = str(mapping.get("module") or "")
        url_includes = mapping.get("urlIncludes") or []
        concept_ids = list(mapping.get("conceptIds") or [])
        if not concept_ids:
            continue
        if module and mapped_module and module == mapped_module:
            add([concept_ids[0]])
            break
        if any(fragment and fragment in path for fragment in url_includes):
            add([concept_ids[0]])
            break

    return ids
