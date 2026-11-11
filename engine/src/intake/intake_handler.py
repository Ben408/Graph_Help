from uuid import uuid4

from src.models import IssueInput, NormalizedIssue


def normalize_issue(issue: IssueInput) -> NormalizedIssue:
    return NormalizedIssue(
        issue_id=f"issue-{uuid4()}",
        raw_text=issue.text.strip(),
        context={
            "module": issue.module,
            "screen": issue.screen,
            "error_code": issue.error_code,
            "help_url": issue.help_url,
            "skill_path_id": issue.skill_path_id,
            "mode": issue.mode,
            "concept_ids": ",".join(issue.concept_ids or []) or None,
        },
    )
