import json

from pydantic import BaseModel, Field

from src.llm.client import StructuredLLM
from src.models import Classification, NormalizedIssue

SYSTEM_PROMPT = """You classify product-usage questions for Help retrieval.
Return structured data only. Be concise and factual.
The search query must be a standalone query optimized for official product Help
in the requested help language (same wording language as that Help locale).
Do not invent error codes, modules, screens, or product behavior.
When a closed vocabulary of product nouns is supplied, feature and help_topics
must use those ids or titles only — never invent object names outside the set.
Confidence measures classification certainty, not whether the issue can be solved."""


class ClassificationDraft(BaseModel):
    feature: str = Field(min_length=1, max_length=100)
    intent: str = Field(min_length=1, max_length=160)
    task_type: str = Field(min_length=1, max_length=80)
    error_type: str | None = Field(default=None, max_length=160)
    help_topics: list[str] = Field(min_length=1, max_length=8)
    search_query: str = Field(min_length=3, max_length=500)
    confidence: float = Field(ge=0, le=1)


def classify_issue(
    issue: NormalizedIssue,
    llm: StructuredLLM,
    *,
    help_language: str = "en_US",
) -> Classification:
    context = {key: value for key, value in issue.context.items() if value}
    vocab = ""
    try:
        from src.knowledge.pack_loader import vocabulary_lines

        lines = vocabulary_lines()
        if lines:
            vocab = (
                "\nClosed product vocabulary (use only these object names):\n"
                f"{lines}\n"
            )
    except Exception:
        vocab = ""
    user_prompt = (
        "Classify this support issue.\n"
        f"Help language for search_query: {help_language}\n"
        f"{vocab}"
        f"Issue: {issue.raw_text}\n"
        f"Provided context: {json.dumps(context, ensure_ascii=False)}"
    )
    draft, model = llm.generate_structured(SYSTEM_PROMPT, user_prompt, ClassificationDraft)
    return Classification(
        **draft.model_dump(),
        model=model,
    )
