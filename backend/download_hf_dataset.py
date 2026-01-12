#!/usr/bin/env python3

import gc
import os
import shutil
import sys
from pathlib import Path

REPO = "NEU-HAI/OPeRA"
CONFIGS = ["full_user", "full_session", "full_action", "filtered_user", "filtered_session", "filtered_action"]
OUTPUT = Path(__file__).parent.parent / "data" / REPO.replace("/", "__")


def main() -> int:
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass

    token = os.environ.get("HF_TOKEN")

    try:
        from datasets import load_dataset
        from datasets.utils.logging import set_verbosity_warning
        from huggingface_hub import hf_hub_download
    except ImportError:
        print("[ERROR] pip install datasets huggingface_hub", file=sys.stderr)
        return 1

    set_verbosity_warning()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    cache = OUTPUT / ".cache"

    print(f"[INFO] {REPO} -> {OUTPUT}\n")

    try:
        shutil.copy(hf_hub_download(REPO, "README.md", repo_type="dataset", token=token), OUTPUT / "README.md")
        print("[OK] README.md")
    except Exception:
        pass

    for cfg in CONFIGS:
        out = OUTPUT / cfg
        if out.exists():
            print(f"[SKIP] {cfg}")
            continue
        print(f"[...] {cfg}")
        try:
            ds = load_dataset(REPO, name=cfg, cache_dir=str(cache), token=token)
            out.mkdir()
            for split, data in ds.items():
                data.to_json(out / f"{split}.json")
            del ds
            gc.collect()
            print(f"[OK] {cfg}")
        except Exception as e:
            print(f"[ERROR] {cfg}: {e}", file=sys.stderr)

    shutil.rmtree(cache, ignore_errors=True)
    print(f"\n[DONE] {OUTPUT}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
