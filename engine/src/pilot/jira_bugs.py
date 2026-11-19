"""Create pilot bug reports in Jira Cloud (with optional local JSONL mirror)."""

from __future__ import annotations

import base64
import binascii
import re
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

import httpx

from config.settings import Settings

MAX_DESCRIPTION_CHARS = 8_000
MAX_SCREENSHOT_BYTES = 4_500_000  # ~4.5 MB decoded


@dataclass
class ScreenshotBytes:
    content: bytes
    content_type: str
    filename: str


@dataclass
class JiraBugResult:
    key: str
    url: str
    mirrored: bool


def _data_url_to_bytes(data_url: str) -> ScreenshotBytes:
    raw = (data_url or "").strip()
    if not raw:
        raise ValueError("screenshot is required")
    match = re.match(
        r"^data:(image/(png|jpeg|jpg|webp));base64,(.+)$",
        raw,
        flags=re.IGNORECASE | re.DOTALL,
    )
    if match:
        mime = match.group(1).lower().replace("image/jpg", "image/jpeg")
        ext = "jpg" if "jpeg" in mime else mime.split("/", 1)[1]
        b64 = match.group(3)
    else:
        # Allow raw base64 PNG
        mime = "image/png"
        ext = "png"
        b64 = raw
    try:
        content = base64.b64decode(b64, validate=False)
    except binascii.Error as exc:
        raise ValueError("screenshot is not valid base64") from exc
    if not content:
        raise ValueError("screenshot is empty")
    if len(content) > MAX_SCREENSHOT_BYTES:
        raise ValueError("screenshot exceeds size limit")
    return ScreenshotBytes(
        content=content,
        content_type=mime,
        filename=f"smart-help-screenshot.{ext}",
    )


def _plain_to_adf(text: str) -> dict[str, Any]:
    paragraphs: list[dict[str, Any]] = []
    for block in text.split("\n"):
        paragraphs.append(
            {
                "type": "paragraph",
                "content": (
                    [{"type": "text", "text": block}] if block else []
                ),
            }
        )
    if not paragraphs:
        paragraphs = [{"type": "paragraph", "content": []}]
    return {"type": "doc", "version": 1, "content": paragraphs}


def _summary_from_description(description: str) -> str:
    first = (description or "").strip().splitlines()[0] if description.strip() else "Bug"
    first = re.sub(r"\s+", " ", first).strip()
    prefix = "[Smart Help pilot] "
    max_len = 255 - len(prefix)
    if len(first) > max_len:
        first = first[: max_len - 1] + "…"
    return prefix + (first or "Bug")


def jira_configured(settings: Settings) -> bool:
    return bool(
        settings.jira_base_url
        and settings.jira_email
        and settings.jira_api_token
        and settings.jira_project_key
    )


def build_description_body(
    description: str,
    context: dict[str, str | None],
) -> str:
    lines = [description.strip(), "", "---", "Context (auto)"]
    for key in (
        "module",
        "screen",
        "title",
        "help_url",
        "panel_mode",
        "extension_version",
        "distribution",
        "client_ts",
        "surface",
    ):
        value = context.get(key)
        if value:
            lines.append(f"{key}: {value}")
    return "\n".join(lines)


def append_pilot_bug_mirror(
    settings: Settings,
    record: dict[str, Any],
) -> str:
    path = settings.runs_dir / "pilot_bugs.jsonl"
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(
            json_dumps(
                {
                    **record,
                    "server_ts": datetime.now(UTC).isoformat(),
                }
            )
            + "\n"
        )
    return path.name


def json_dumps(payload: dict[str, Any]) -> str:
    import json

    return json.dumps(payload, ensure_ascii=False)


def _httpx_verify(settings: Settings) -> bool | Any:
    """Use the OS certificate store when possible (fixes Windows SSL MITM/CA gaps)."""
    if not settings.jira_ssl_verify:
        return False
    try:
        import ssl

        import truststore

        return truststore.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    except Exception:
        return True


def create_jira_bug(
    settings: Settings,
    *,
    description: str,
    screenshot_data_url: str,
    context: dict[str, str | None],
) -> JiraBugResult:
    if not jira_configured(settings):
        raise RuntimeError("Jira is not configured")

    shot = _data_url_to_bytes(screenshot_data_url)
    body_text = build_description_body(description, context)
    base = settings.jira_base_url.rstrip("/")
    auth = (settings.jira_email, settings.jira_api_token)
    issue_type = settings.jira_issue_type or "Bug"

    create_payload: dict[str, Any] = {
        "fields": {
            "project": {"key": settings.jira_project_key},
            "summary": _summary_from_description(description),
            "issuetype": {"name": issue_type},
            "description": _plain_to_adf(body_text),
            "labels": ["smart-help-pilot", "from-panel"],
        }
    }

    with httpx.Client(timeout=60.0, verify=_httpx_verify(settings)) as client:
        create_res = client.post(
            f"{base}/rest/api/3/issue",
            auth=auth,
            headers={"Accept": "application/json", "Content-Type": "application/json"},
            json=create_payload,
        )
        if create_res.status_code >= 400:
            # Retry without labels if the project rejects them
            detail = create_res.text[:500]
            if "labels" in detail.lower() or create_res.status_code == 400:
                create_payload["fields"].pop("labels", None)
                create_res = client.post(
                    f"{base}/rest/api/3/issue",
                    auth=auth,
                    headers={
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                    },
                    json=create_payload,
                )
            if create_res.status_code >= 400:
                raise RuntimeError(
                    f"Jira create failed ({create_res.status_code}): {create_res.text[:400]}"
                )

        created = create_res.json()
        key = str(created.get("key") or "")
        if not key:
            raise RuntimeError("Jira create returned no issue key")

        attach_res = client.post(
            f"{base}/rest/api/3/issue/{key}/attachments",
            auth=auth,
            headers={
                "Accept": "application/json",
                "X-Atlassian-Token": "no-check",
            },
            files={
                "file": (shot.filename, shot.content, shot.content_type),
            },
        )
        if attach_res.status_code >= 400:
            raise RuntimeError(
                f"Jira attach failed ({attach_res.status_code}): {attach_res.text[:400]}"
            )

    url = f"{base}/browse/{key}"
    return JiraBugResult(key=key, url=url, mirrored=True)
