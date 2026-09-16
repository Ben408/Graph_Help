"""Fixed Ask smoke pack — record pass/fail for pre-editorial gating.

Usage (engine must already be up on 8765):

  .\\.venv\\Scripts\\python.exe scripts\\ask_smoke.py
  .\\.venv\\Scripts\\python.exe scripts\\ask_smoke.py --base-url http://127.0.0.1:8765

Writes JSON + markdown under engine/data/runs/smoke/
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import httpx

ENGINE_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT = ENGINE_ROOT / "data" / "runs" / "smoke"

# Fixed cases for Codex / humans. Expectations are engineering gates, not editorial taste.
CASES: list[dict[str, Any]] = [
    {
        "id": "out_of_scope_spacecraft",
        "text": "How do I configure orbital fuel tanks on my spacecraft?",
        "expect_status": "refused",
        "expect_refusal": {"out_of_scope", "ambiguous"},
        "forbid_skill_paths": True,
        "forbid_touched_concepts": True,
        "notes": "Must refuse cleanly; no Ledger foundations / Order-to-cash.",
    },
    {
        "id": "reverse_journal",
        "text": "How do I reverse a journal entry in Sage Intacct?",
        "expect_status": "completed",
        "title_any": ("reverse", "reversing", "journal"),
        "forbid_title_any": ("approval", "import journal", "statistical"),
        "notes": "Stay on reverse/reversing journal; no approval/import sprawl.",
    },
    {
        "id": "ap_gl_mismatch",
        "text": "Why do Accounts Payable and General Ledger not match?",
        "expect_status": "completed",
        "title_any": ("discrepan", "subledger", "ap ", "accounts payable"),
        "prefer_skill_paths": ("period-close", "ledger-foundations"),
        "forbid_skill_paths_named": ("order-to-cash",),
        "notes": "Cite discrepancy Help; prefer period-close / ledger-foundations.",
    },
    {
        "id": "close_books",
        "text": "How do I close the books in General Ledger?",
        "expect_status": "completed",
        "title_any": ("close", "books", "period", "general ledger"),
        "watch_only": True,
        "notes": "KNOWN WATCH — close-books retrieval may still drift; log outcome, do not file as editorial.",
    },
]


def _post_ask(client: httpx.Client, text: str) -> dict[str, Any]:
    response = client.post("/api/ask", json={"text": text})
    response.raise_for_status()
    return response.json()


def _poll(client: httpx.Client, ask_id: str, timeout_s: float = 240.0) -> dict[str, Any]:
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        response = client.get(f"/api/ask/{ask_id}")
        response.raise_for_status()
        payload = response.json()
        if payload.get("status") in {"completed", "refused", "failed"}:
            return payload
        time.sleep(2.5)
    raise TimeoutError(f"Ask {ask_id} did not finish within {timeout_s}s")


def _titles(result: dict[str, Any]) -> list[str]:
    sources = result.get("sources") or []
    if result.get("answer") and result["answer"].get("sources"):
        sources = result["answer"]["sources"]
    return [str(s.get("title") or "") for s in sources]


def _evaluate(case: dict[str, Any], result: dict[str, Any]) -> dict[str, Any]:
    issues: list[str] = []
    status = result.get("status")
    if status != case["expect_status"] and not case.get("watch_only"):
        issues.append(f"status={status} expected={case['expect_status']}")
    elif status != case["expect_status"] and case.get("watch_only"):
        issues.append(f"WATCH status={status} expected={case['expect_status']}")

    refusal = result.get("refusal_reason")
    if case.get("expect_refusal") and refusal not in case["expect_refusal"]:
        issues.append(f"refusal_reason={refusal} expected one of {sorted(case['expect_refusal'])}")

    if case.get("forbid_skill_paths") and (result.get("skill_path_ids") or []):
        issues.append(f"skill_path_ids should be empty, got {result.get('skill_path_ids')}")

    if case.get("forbid_touched_concepts") and (result.get("touched_concept_ids") or []):
        issues.append(
            f"touched_concept_ids should be empty on clean refuse, got {result.get('touched_concept_ids')}"
        )

    titles = _titles(result)
    blob = " | ".join(titles).lower()
    if case.get("title_any") and status == "completed":
        if not any(tip in blob for tip in case["title_any"]):
            issues.append(f"cited titles missing expected cues {case['title_any']}: {titles[:5]}")

    if case.get("forbid_title_any") and status == "completed":
        bad = [tip for tip in case["forbid_title_any"] if tip in blob]
        # Only flag if the bad tip appears and none of the good cues dominate first title
        if bad and titles:
            first = titles[0].lower()
            if not any(tip in first for tip in (case.get("title_any") or ())):
                issues.append(f"first cited title looks off-goal ({titles[0]}); forbid hit {bad}")

    paths = [str(p) for p in (result.get("skill_path_ids") or [])]
    if case.get("forbid_skill_paths_named"):
        banned = [p for p in paths if p in case["forbid_skill_paths_named"]]
        if banned:
            issues.append(f"forbidden skill paths present: {banned}")

    if case.get("prefer_skill_paths") and paths and status == "completed":
        if paths[0] not in case["prefer_skill_paths"]:
            issues.append(
                f"skill_path_ids[0]={paths[0]} preferred one of {case['prefer_skill_paths']}"
            )

    watch = bool(case.get("watch_only"))
    if watch:
        passed = status in {"completed", "refused", "failed"}  # always "recorded"
        verdict = "watch"
    else:
        passed = len(issues) == 0
        verdict = "pass" if passed else "fail"

    return {
        "case_id": case["id"],
        "verdict": verdict,
        "passed": passed if not watch else None,
        "issues": issues,
        "ask_id": result.get("ask_id"),
        "status": status,
        "refusal_reason": refusal,
        "skill_path_ids": paths,
        "touched_concept_ids": result.get("touched_concept_ids") or [],
        "titles": titles[:8],
        "coverage_gap": result.get("coverage_gap"),
        "notes": case.get("notes"),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Ask smoke pack for pre-editorial gate")
    parser.add_argument("--base-url", default="http://127.0.0.1:8765")
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--timeout", type=float, default=240.0)
    args = parser.parse_args()

    args.out_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    rows: list[dict[str, Any]] = []

    try:
        with httpx.Client(base_url=args.base_url.rstrip("/"), timeout=60.0) as client:
            health = client.get("/api/health")
            health.raise_for_status()
            print(f"health={health.json().get('status')}", flush=True)
            for case in CASES:
                print(f"\n=== {case['id']} ===", flush=True)
                print(f"Q: {case['text']}", flush=True)
                try:
                    queued = _post_ask(client, case["text"])
                    ask_id = queued["ask_id"]
                    result = _poll(client, ask_id, timeout_s=args.timeout)
                    row = _evaluate(case, result)
                except Exception as exc:  # noqa: BLE001
                    row = {
                        "case_id": case["id"],
                        "verdict": "fail",
                        "passed": False,
                        "issues": [str(exc)],
                        "ask_id": None,
                        "status": "error",
                        "notes": case.get("notes"),
                    }
                rows.append(row)
                print(
                    f"-> {row['verdict']} status={row.get('status')} "
                    f"ask_id={row.get('ask_id')} issues={row.get('issues')}",
                    flush=True,
                )
    except Exception as exc:  # noqa: BLE001
        print(f"FATAL: cannot reach engine at {args.base_url}: {exc}", file=sys.stderr)
        return 2

    hard_fails = [r for r in rows if r["verdict"] == "fail"]
    payload = {
        "generated_at": datetime.now(UTC).isoformat(),
        "base_url": args.base_url,
        "hard_fail_count": len(hard_fails),
        "cases": rows,
    }
    json_path = args.out_dir / f"ask_smoke_{stamp}.json"
    latest_json = args.out_dir / "ask_smoke_latest.json"
    json_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    latest_json.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    lines = [
        "# Ask smoke results",
        "",
        f"Generated: {payload['generated_at']}",
        f"Engine: {args.base_url}",
        f"Hard fails: {len(hard_fails)}",
        "",
    ]
    for row in rows:
        lines.append(f"## `{row['case_id']}` — **{row['verdict']}**")
        lines.append(f"- ask_id: `{row.get('ask_id')}`")
        lines.append(f"- status: `{row.get('status')}` refusal=`{row.get('refusal_reason')}`")
        if row.get("skill_path_ids") is not None:
            lines.append(f"- skill_paths: {', '.join(row.get('skill_path_ids') or []) or '(none)'}")
        if row.get("titles"):
            lines.append("- titles:")
            for title in row["titles"]:
                lines.append(f"  - {title}")
        if row.get("issues"):
            lines.append("- issues:")
            for issue in row["issues"]:
                lines.append(f"  - {issue}")
        if row.get("notes"):
            lines.append(f"- notes: {row['notes']}")
        lines.append("")
    md_path = args.out_dir / f"ask_smoke_{stamp}.md"
    latest_md = args.out_dir / "ask_smoke_latest.md"
    md_path.write_text("\n".join(lines), encoding="utf-8")
    latest_md.write_text("\n".join(lines), encoding="utf-8")
    print(f"\nWrote {json_path}")
    print(f"Wrote {md_path}")
    return 1 if hard_fails else 0


if __name__ == "__main__":
    raise SystemExit(main())
