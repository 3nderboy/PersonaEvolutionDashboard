#!/usr/bin/env python3
"""
Download OPeRA Dataset from HuggingFace

Downloads the NEU-HAI/OPeRA dataset and saves as CSV files.

Usage:
    python download_hf_dataset.py
"""

import gc
import os
import shutil
import sys

from config import OPERA_DATA_DIR
from utils import Logger

REPO = "NEU-HAI/OPeRA"
CONFIGS = ["full_user", "full_session", "full_action", "filtered_user", "filtered_session", "filtered_action"]


def main() -> int:
    log = Logger("download_hf_dataset")
    log.header("Download OPeRA Dataset")

    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        pass

    token = os.environ.get("HF_TOKEN")

    log.step(1, "Loading dependencies")
    try:
        from datasets import load_dataset
        from datasets.utils.logging import set_verbosity_warning
        from huggingface_hub import hf_hub_download
        log.success("Dependencies loaded")
    except ImportError:
        log.info("Installing dependencies...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "datasets", "huggingface_hub"])
        from datasets import load_dataset
        from datasets.utils.logging import set_verbosity_warning
        from huggingface_hub import hf_hub_download
        log.success("Dependencies installed")

    set_verbosity_warning()
    OPERA_DATA_DIR.mkdir(parents=True, exist_ok=True)
    cache = OPERA_DATA_DIR / ".cache"

    log.info(f"Repository: {REPO}")
    log.info(f"Output: {OPERA_DATA_DIR}")

    log.step(2, "Downloading README")
    try:
        shutil.copy(hf_hub_download(REPO, "README.md", repo_type="dataset", token=token), OPERA_DATA_DIR / "README.md")
        log.success("README.md")
    except Exception:
        log.warning("README.md not available")

    log.step(3, "Downloading datasets")
    processed = 0
    skipped = 0
    errors = 0

    for i, cfg in enumerate(CONFIGS, 1):
        out = OPERA_DATA_DIR / cfg
        if out.exists():
            log.info(f"[SKIP] {cfg}")
            skipped += 1
            continue
        
        log.progress(i, len(CONFIGS), cfg)
        try:
            ds = load_dataset(REPO, name=cfg, cache_dir=str(cache), token=token)
            out.mkdir()
            for split, data in ds.items():
                data.to_csv(out / f"{split}.csv")
            del ds
            gc.collect()
            processed += 1
        except Exception as e:
            errors += 1
            log.error(f"{cfg}: {e}")

    shutil.rmtree(cache, ignore_errors=True)
    
    log.summary(processed=processed, skipped=skipped, errors=errors)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
