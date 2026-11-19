"""Per-pack filesystem paths and pack.json resolution."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from config.settings import ENGINE_ROOT, Settings

PACKS_ROOT = ENGINE_ROOT.parent / "packs"
DEFAULT_PACK_ID = "sage-intacct"
KNOWN_PACK_IDS = ("sage-intacct", "sage-planning")


@dataclass(frozen=True)
class PackRuntimePaths:
    pack_id: str
    pack_json: Path
    help_cache_dir: Path
    help_assets_dir: Path
    okf_dir: Path
    vector_store_dir: Path


def normalize_pack_id(pack_id: str | None) -> str:
    if pack_id and pack_id in KNOWN_PACK_IDS:
        return pack_id
    return DEFAULT_PACK_ID


def pack_json_path(pack_id: str | None) -> Path:
    pid = normalize_pack_id(pack_id)
    return PACKS_ROOT / pid / "pack.json"


def detect_pack_id_from_url(url: str | None) -> str | None:
    if not url:
        return None
    lowered = url.lower()
    try:
        from urllib.parse import urlparse

        host = urlparse(url if "://" in url else f"https://{url}").hostname or ""
    except Exception:  # noqa: BLE001
        host = lowered
    host = host.lower().removeprefix("www.")
    if host == "intacct-planning.com" or host.endswith(".intacct-planning.com"):
        return "sage-planning"
    if host == "intacct.com" or host.endswith(".intacct.com"):
        return "sage-intacct"
    if "intacct-planning.com" in lowered:
        return "sage-planning"
    if "intacct.com" in lowered and "intacct-planning" not in lowered:
        return "sage-intacct"
    return None


def resolve_pack_id(
    *,
    pack_id: str | None = None,
    page_url: str | None = None,
    help_url: str | None = None,
) -> str:
    if pack_id and pack_id in KNOWN_PACK_IDS:
        return pack_id
    return (
        detect_pack_id_from_url(page_url)
        or detect_pack_id_from_url(help_url)
        or DEFAULT_PACK_ID
    )


def runtime_paths_for_pack(settings: Settings, pack_id: str | None) -> PackRuntimePaths:
    """Pack-scoped data dirs under engine/data/packs/{id}/.

    For sage-intacct, prefer pack-scoped dirs when they exist; otherwise fall back
    to legacy flat engine/data/{okf,vector_store,help_xhtml} so existing corpora keep working.
    """
    pid = normalize_pack_id(pack_id)
    pack_json = pack_json_path(pid)
    scoped = settings.data_dir / "packs" / pid
    scoped_okf = scoped / "okf"
    legacy_okf = settings.data_dir / "okf"

    use_legacy = (
        pid == DEFAULT_PACK_ID
        and not scoped_okf.joinpath("catalog.json").is_file()
        and legacy_okf.joinpath("catalog.json").is_file()
    )
    if use_legacy:
        return PackRuntimePaths(
            pack_id=pid,
            pack_json=pack_json,
            help_cache_dir=settings.data_dir / "help_xhtml",
            help_assets_dir=settings.data_dir / "help_assets",
            okf_dir=legacy_okf,
            vector_store_dir=settings.data_dir / "vector_store",
        )
    return PackRuntimePaths(
        pack_id=pid,
        pack_json=pack_json,
        help_cache_dir=scoped / "help_xhtml",
        help_assets_dir=scoped / "help_assets",
        okf_dir=scoped_okf,
        vector_store_dir=scoped / "vector_store",
    )


def ensure_pack_dirs(paths: PackRuntimePaths) -> None:
    for path in (
        paths.help_cache_dir,
        paths.help_assets_dir,
        paths.help_assets_dir / "files",
        paths.okf_dir,
        paths.vector_store_dir,
    ):
        path.mkdir(parents=True, exist_ok=True)
