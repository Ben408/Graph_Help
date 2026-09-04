from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config.settings import Settings, get_settings
from src.knowledge.overlay import overlay_ask_result
from src.knowledge.pack_loader import load_pack
from src.knowledge.practice import practice_for_concept
from src.llm.client import OllamaClient
from src.models import AskFeedbackInput, AskResult, IssueInput, ProgressEvent, RefreshResult
from src.qa.ask_agent import AskService
from src.qa.lexical_ask import lexical_ask
from src.rag.corpus_refresh import CorpusRefreshService
from src.rag.okf.store import OkfStore
from src.rag.vector_store import VectorStore
from src.runtime_gate import WorkGate
from src.telemetry.logging import configure_logging
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
        ],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    def _okf() -> OkfStore | None:
        return ask.okf_store

    def _run_ask(ask_id: str, issue: IssueInput) -> None:
        result = ask.run(ask_id, issue)
        if result.status == "failed":
            fallback = lexical_ask(issue, _okf())
            fallback.ask_id = ask_id
            result = fallback
        overlay_ask_result(result)
        ask._write_result(result)

    @app.get("/api/health")
    def health() -> dict[str, object]:
        okf = _okf()
        return {
            "status": "ok",
            "pack": load_pack().get("id"),
            "okf": okf.status() if okf else {"available": False},
            "workspace": gate.status(),
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

    return app


app = create_app()
