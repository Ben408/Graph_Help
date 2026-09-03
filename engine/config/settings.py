from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ENGINE_ROOT = Path(__file__).resolve().parents[1]
REPO_PACK = ENGINE_ROOT.parent / "packs" / "sage-intacct" / "pack.json"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"
    app_host: str = "127.0.0.1"
    app_port: int = 8765
    web_origin: str = "http://localhost:3000"

    ollama_base_url: str = "http://127.0.0.1:11434"
    ollama_chat_model: str = "gemma3:12b"
    ollama_fallback_model: str = ""
    ollama_embed_model: str = "nomic-embed-text"
    ollama_timeout_seconds: float = 180
    rag_top_k: int = 6
    rag_min_score: float = 0.2

    intacct_help_start_url: str = (
        "https://www.intacct.com/ia/docs/en_US/help_action/Intacct_basics/welcome.htm"
    )
    intacct_help_allowed_prefix: str = (
        "https://www.intacct.com/ia/docs/en_US/help_action/"
    )
    help_locales: str = "en_US"
    crawl_delay_seconds: float = 0.25
    pack_path: Path = REPO_PACK

    data_dir: Path = ENGINE_ROOT / "data"
    help_cache_dir: Path = ENGINE_ROOT / "data" / "help_xhtml"
    help_assets_dir: Path = ENGINE_ROOT / "data" / "help_assets"
    okf_dir: Path = ENGINE_ROOT / "data" / "okf"
    vector_store_dir: Path = ENGINE_ROOT / "data" / "vector_store"
    runs_dir: Path = ENGINE_ROOT / "data" / "runs"
    log_level: str = "INFO"

    def ensure_runtime_directories(self) -> None:
        for path in (
            self.data_dir,
            self.help_cache_dir,
            self.help_assets_dir,
            self.help_assets_dir / "files",
            self.okf_dir,
            self.vector_store_dir,
            self.runs_dir,
        ):
            path.mkdir(parents=True, exist_ok=True)

    def apply_pack_corpus(self) -> None:
        if not self.pack_path.is_file():
            return
        import json

        payload = json.loads(self.pack_path.read_text(encoding="utf-8"))
        corpus = payload.get("corpus") or {}
        if corpus.get("startUrl"):
            self.intacct_help_start_url = str(corpus["startUrl"])
        if corpus.get("allowedPrefix"):
            self.intacct_help_allowed_prefix = str(corpus["allowedPrefix"])
        if corpus.get("locale"):
            self.help_locales = str(corpus["locale"])


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.apply_pack_corpus()
    settings.ensure_runtime_directories()
    return settings
