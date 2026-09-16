import json
import os
from pathlib import Path
from threading import Lock
from time import sleep
from typing import Any

REPLACE_ATTEMPTS = 12
REPLACE_PAUSE_SECONDS = 0.05


class JsonRunStore:
    """Thread-safe JSON run storage that must receive metadata-only records."""

    def __init__(self, root: Path) -> None:
        self.root = root
        self.root.mkdir(parents=True, exist_ok=True)
        self._lock = Lock()

    def _path(self, run_id: str) -> Path:
        safe_id = "".join(
            character for character in run_id if character.isalnum() or character in "-_"
        )
        return self.root / f"{safe_id}.json"

    def _load(self, path: Path, run_id: str) -> dict[str, Any]:
        if not path.exists():
            return {"run_id": run_id, "events": []}
        return json.loads(path.read_text(encoding="utf-8"))

    def _save(self, path: Path, record: dict[str, Any]) -> None:
        temporary = path.with_suffix(".tmp")
        temporary.write_text(json.dumps(record, indent=2, default=str), encoding="utf-8")
        # On Windows the replace is denied while anything else holds the target
        # open — a polling reader, Defender, or the search indexer. Retry briefly
        # instead of failing the run it belongs to.
        for attempt in range(REPLACE_ATTEMPTS):
            try:
                os.replace(temporary, path)
                return
            except PermissionError:
                if attempt == REPLACE_ATTEMPTS - 1:
                    raise
                sleep(REPLACE_PAUSE_SECONDS)

    def read(self, run_id: str) -> dict[str, Any]:
        # Reads share the lock so in-process pollers never hold a run file open
        # while the pipeline is replacing it.
        with self._lock:
            return self._load(self._path(run_id), run_id)

    def write(self, run_id: str, record: dict[str, Any]) -> None:
        with self._lock:
            self._save(self._path(run_id), record)

    def append_event(self, run_id: str, event: dict[str, Any]) -> None:
        with self._lock:
            path = self._path(run_id)
            record = self._load(path, run_id)
            record.setdefault("events", []).append(event)
            self._save(path, record)
