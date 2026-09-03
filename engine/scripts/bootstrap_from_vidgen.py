"""Copy an existing VidGen Help corpus into this engine (optional bootstrap)."""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path

ENGINE_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_VIDGEN = Path(r"F:\SI_VidGen")


def copy_tree(src: Path, dst: Path) -> None:
    if not src.exists():
        print(f"skip missing {src}")
        return
    dst.parent.mkdir(parents=True, exist_ok=True)
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src, dst)
    print(f"copied {src} -> {dst}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--vidgen", type=Path, default=DEFAULT_VIDGEN)
    args = parser.parse_args()
    root = args.vidgen
    data = ENGINE_ROOT / "data"
    data.mkdir(parents=True, exist_ok=True)
    copy_tree(root / "data" / "okf", data / "okf")
    copy_tree(root / "data" / "vector_store", data / "vector_store")
    copy_tree(root / "data" / "help_xhtml", data / "help_xhtml")
    print("Bootstrap complete. Start the engine with: python -m uvicorn app:app --app-dir engine --port 8765")


if __name__ == "__main__":
    main()
