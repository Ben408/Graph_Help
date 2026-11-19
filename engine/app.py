from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config.settings import Settings, get_settings
from src.knowledge.context_resolve import resolve_panel_context
from src.knowledge.overlay import overlay_ask_result
from src.knowledge.pack_loader import load_pack
from src.knowledge.practice import practice_for_concept
from src.llm.client import OllamaClient
from src.models import (
    AskFeedbackInput,
    AskResult,
    IssueInput,
    PilotBugInput,
    ProgressEvent,
    RefreshResult,
)
from src.pilot.jira_bugs import (
    MAX_DESCRIPTION_CHARS,
    append_pilot_bug_mirror,
    create_jira_bug,
    jira_configured,
)
from src.qa.ask_agent import AskService
from src.qa.lexical_ask import lexical_ask
from src.rag.corpus_refresh import CorpusRefreshService
from src.rag.okf.store import OkfStore
from src.rag.vector_store import VectorStore
from src.runtime_gate import WorkGate
from src.telemetry.logging import configure_logging, log_event
from src.telemetry.progress import ProgressTracker
from src.telemetry.run_store import JsonRunStore
from datetime import UTC, datetime
import json


def create_app(
    settings: Settings | None = None,
    llm: OllamaClient | None = None,
    vector_store: VectorStore | None = None,
    ask_service: AskService | None = None,
    refresh_service: CorpusRefreshService | None = None,
    work_gate: WorkGate | None = None,
) -> FastAPI:
    settings = settings or get_settings()
    settings.ensure_runtime_directories()
    configure_logging(settings.log_level)

    run_store = JsonRunStore(settings.runs_dir)
    tracker = ProgressTracker(run_store)
    gate = work_gate or WorkGate()
    ask = ask_service or AskService(
        settings,
        run_store,
        tracker,
        gate,
        llm=llm,
        vector_store=vector_store,
    )
    refresh = refresh_service or CorpusRefreshService(
        settings, run_store, tracker, gate
    )

    app = FastAPI(title="Knowledge engine", version="0.1.0")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            settings.web_origin,
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3001",
            "http://127.0.0.1:3001",
            "http://localhost:3002",
            "http://127.0.0.1:3002",
        ],
        # Extension + Vercel preview/prod origins for hosted Diagnostics.
        allow_origin_regex=r"(chrome-extension://.*|https://.*\.vercel\.app)",
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    def _okf() -> OkfStore | None:
        return ask.okf_store

    def _run_ask(ask_id: str, issue: IssueInput) -> None:
        result = ask.run(ask_id, issue)
        if result.status == "failed":
            log_event(
                "ask_engine_failed",
                run_id=ask_id,
                error_code=result.error_code,
                error_detail=(result.error_detail or "")[:300],
            )
            fallback = lexical_ask(issue, _okf())
            fallback.ask_id = ask_id
            # A lexical miss is not evidence that Help lacks coverage, so keep the
            # engine failure visible rather than reporting a content gap.
            if fallback.status == "completed":
                result = fallback
        overlay_ask_result(
            result,
            seed_concept_ids=list(issue.concept_ids or []),
            preferred_skill_path_id=issue.skill_path_id,
        )
        ask._write_result(result)

    @app.get("/api/health")
    def health() -> dict[str, object]:
        okf = _okf()
        okf_status = okf.status() if okf else {"available": False}
        llm_status = ask.llm.check()
        vector_status: dict[str, object] = {
            "available": False,
            "dir": str(settings.vector_store_dir),
        }
        try:
            store = ask.vector_store
            count = store.count() if hasattr(store, "count") else None
            vector_status = {
                "available": count is None or int(count) > 0,
                "count": count,
                "dir": str(settings.vector_store_dir),
            }
        except Exception as error:  # noqa: BLE001 — health must never crash
            vector_status = {
                "available": False,
                "dir": str(settings.vector_store_dir),
                "detail": f"{type(error).__name__}: {error}"[:200],
            }

        chat_ready = bool(llm_status.get("chat_model_pulled") or llm_status.get("ready"))
        embed_ready = bool(llm_status.get("embed_model_pulled") or llm_status.get("ready"))
        if "chat_model_pulled" not in llm_status and llm_status.get("ready"):
            chat_ready = True
            embed_ready = True

        return {
            "status": "ok",
            "ready": bool(llm_status.get("ready")) and bool(okf_status.get("available")),
            "pack": load_pack().get("id"),
            "app_env": settings.app_env,
            "llm": {
                **llm_status,
                "chat_ready": chat_ready,
                "embed_ready": embed_ready,
            },
            "okf": okf_status,
            "vector": vector_status,
            "workspace": gate.status(),
            "jira": {"configured": jira_configured(settings)},
            "checked_at": datetime.now(UTC).isoformat(),
        }

    @app.get("/api/pack")
    def pack() -> dict[str, object]:
        payload = load_pack()
        return {
            "id": payload.get("id"),
            "name": payload.get("name"),
            "vocabularyCount": len(payload.get("vocabulary") or []),
            "skillPathCount": len(payload.get("skillPaths") or []),
            "corpus": payload.get("corpus"),
        }

    @app.post("/api/ask", status_code=202)
    def create_ask(issue: IssueInput, background_tasks: BackgroundTasks) -> AskResult:
        ask_id = ask.create_ask_id()
        queued = ask.queue(ask_id)
        background_tasks.add_task(_run_ask, ask_id, issue)
        return queued

    @app.get("/api/ask/{ask_id}", response_model=AskResult)
    def get_ask(ask_id: str) -> AskResult:
        result = ask.get_result(ask_id)
        if result is None:
            raise HTTPException(status_code=404, detail="Ask not found")
        return overlay_ask_result(result)

    @app.get("/api/ask/{ask_id}/progress", response_model=list[ProgressEvent])
    def get_ask_progress(ask_id: str) -> list[ProgressEvent]:
        record = run_store.read(ask_id)
        if "result" not in record:
            raise HTTPException(status_code=404, detail="Ask not found")
        return [ProgressEvent.model_validate(item) for item in record.get("events", [])]

    @app.post("/api/ask/{ask_id}/feedback")
    def post_ask_feedback(ask_id: str, payload: AskFeedbackInput) -> dict[str, object]:
        """Stateless multi-user feedback: append-only JSONL under engine/data/runs/."""
        if payload.ask_id != ask_id:
            raise HTTPException(status_code=400, detail="ask_id mismatch")
        path = settings.runs_dir / "ask_feedback.jsonl"
        record = {
            **payload.model_dump(),
            "server_ts": datetime.now(UTC).isoformat(),
        }
        with path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(record, ensure_ascii=False) + "\n")
        return {"ok": True, "path": str(path.name)}

    @app.post("/api/pilot/bugs")
    def post_pilot_bug(payload: PilotBugInput) -> dict[str, object]:
        """Pilot Report a bug → JSONL mirror + Jira issue with screenshot."""
        description = payload.description.strip()
        if len(description) > MAX_DESCRIPTION_CHARS:
            raise HTTPException(status_code=400, detail="description too long")

        context = {
            "module": payload.module,
            "screen": payload.screen,
            "title": payload.title,
            "help_url": payload.help_url,
            "panel_mode": payload.panel_mode,
            "extension_version": payload.extension_version,
            "distribution": payload.distribution,
            "surface": payload.surface,
            "client_ts": payload.client_ts,
        }
        mirror = {
            "description": description,
            "screenshot_bytes_est": max(0, len(payload.screenshot_data_url) // 4 * 3),
            **{k: v for k, v in context.items() if v},
        }
        mirror_name = append_pilot_bug_mirror(settings, mirror)

        if not jira_configured(settings):
            raise HTTPException(
                status_code=503,
                detail=(
                    "Jira is not configured on the engine. "
                    "Set JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN, and JIRA_PROJECT_KEY. "
                    f"Report was saved locally ({mirror_name})."
                ),
            )

        try:
            result = create_jira_bug(
                settings,
                description=description,
                screenshot_data_url=payload.screenshot_data_url,
                context=context,
            )
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        except Exception as exc:
            log_event(
                "pilot_bug_jira_failed",
                error_detail=str(exc)[:400],
            )
            raise HTTPException(
                status_code=502,
                detail=(
                    f"Jira create failed: {exc}. "
                    f"Report was saved locally ({mirror_name})."
                ),
            ) from exc

        append_pilot_bug_mirror(
            settings,
            {
                **mirror,
                "jira_key": result.key,
                "jira_url": result.url,
            },
        )
        return {
            "ok": True,
            "key": result.key,
            "url": result.url,
            "mirrored": mirror_name,
        }

    @app.post("/api/corpus/refresh", status_code=202)
    def start_corpus_refresh(background_tasks: BackgroundTasks) -> RefreshResult:
        refresh_id = refresh.create_refresh_id()
        queued = refresh.queue(refresh_id)
        background_tasks.add_task(refresh.run, refresh_id)
        return queued

    @app.get("/api/corpus/refresh/{refresh_id}", response_model=RefreshResult)
    def get_corpus_refresh(refresh_id: str) -> RefreshResult:
        result = refresh.get_result(refresh_id)
        if result is None:
            raise HTTPException(status_code=404, detail="Refresh not found")
        return result

    @app.get("/api/corpus/refresh/{refresh_id}/progress", response_model=list[ProgressEvent])
    def get_corpus_refresh_progress(refresh_id: str) -> list[ProgressEvent]:
        record = run_store.read(refresh_id)
        if "result" not in record:
            raise HTTPException(status_code=404, detail="Refresh not found")
        return [ProgressEvent.model_validate(item) for item in record.get("events", [])]

    @app.get("/api/practice/{concept_id}")
    def practice(concept_id: str) -> dict[str, object]:
        okf = _okf()
        if okf is None or not okf.available:
            return {"conceptId": concept_id, "procedures": [], "okfAvailable": False}
        return {
            "conceptId": concept_id,
            "okfAvailable": True,
            "procedures": practice_for_concept(okf, concept_id),
        }

    @app.get("/api/context/resolve")
    def context_resolve(
        module: str | None = None,
        screen: str | None = None,
        title: str | None = None,
        help_url: str | None = None,
    ) -> dict[str, object]:
        return resolve_panel_context(
            module=module,
            screen=screen,
            title=title,
            help_url=help_url,
        )

    return app


app = create_app()
