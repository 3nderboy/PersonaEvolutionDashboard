#!/usr/bin/env python3
"""
Usage:
    python run_pipeline.py              # Core pipeline (fast, no LLM)
    python run_pipeline.py --all        # Full pipeline with LLM
    python run_pipeline.py --llm        # LLM steps only (requires existing data)

Steps:
    Core Pipeline (default):
        1. download     - Download OPeRA dataset from HuggingFace
        2. cluster      - Generate personas via behavioral clustering

    LLM Pipeline (--all or --llm):
        3. extract      - Extract user profiles from transcripts (LLM)
        4. combine      - Combine user profiles into single file
        5. personas     - Generate cluster proto-personas (LLM)
"""

import argparse
import subprocess
import sys
from pathlib import Path

from utils import Logger

SCRIPT_DIR = Path(__file__).parent

# Define pipeline steps
CORE_STEPS = [
    ("download", "download_hf_dataset.py", "Download OPeRA dataset"),
    ("cluster", "persona_clustering.py", "Generate behavioral personas"),
]

LLM_STEPS = [
    ("extract", "extract_users.py", "Extract user profiles (LLM)"),
    ("combine", "combine_users.py", "Combine user profiles"),
    ("personas", "extract_personas.py", "Generate cluster proto-personas (LLM)"),
]

ALL_STEPS = CORE_STEPS + LLM_STEPS


def run_script(script_name: str, log: Logger, extra_args: list = None) -> bool:
    """Run a Python script and return success status."""
    script_path = SCRIPT_DIR / script_name
    
    if not script_path.exists():
        log.error(f"Script not found: {script_name}")
        return False
    
    cmd = [sys.executable, str(script_path)]
    if extra_args:
        cmd.extend(extra_args)
    
    try:
        result = subprocess.run(cmd, cwd=str(SCRIPT_DIR))
        return result.returncode == 0
    except Exception as e:
        log.error(f"Failed to run {script_name}: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Run the backend data pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    
    mode_group = parser.add_mutually_exclusive_group()
    mode_group.add_argument(
        "--all", action="store_true",
        help="Run full pipeline including LLM extraction"
    )
    mode_group.add_argument(
        "--llm", action="store_true",
        help="Run only LLM extraction steps (requires existing data)"
    )
    mode_group.add_argument(
        "--step", type=str, metavar="NAME",
        help="Run a specific step (download, cluster, extract, combine, personas)"
    )
    
    parser.add_argument(
        "--provider", choices=["ollama", "openai"], default="ollama",
        help="LLM provider for extraction steps (default: ollama)"
    )
    
    args = parser.parse_args()
    
    log = Logger("run_pipeline")
    log.header("Backend Pipeline Runner")
    
    # Determine which steps to run
    if args.step:
        step_map = {s[0]: s for s in ALL_STEPS}
        if args.step not in step_map:
            log.error(f"Unknown step: {args.step}")
            log.info(f"Available: {', '.join(step_map.keys())}")
            return 1
        steps = [step_map[args.step]]
    elif args.llm:
        steps = LLM_STEPS
    elif args.all:
        steps = ALL_STEPS
    else:
        steps = CORE_STEPS
    
    # Show plan
    log.step(0, "Execution plan")
    for i, (name, script, desc) in enumerate(steps, 1):
        log.info(f"{i}. {name}: {desc}")
    
    # Execute steps
    success = 0
    failed = 0
    llm_scripts = {"extract_users.py", "extract_personas.py"}
    
    for i, (name, script, desc) in enumerate(steps, 1):
        log.step(i, desc)
        
        extra_args = []
        if script in llm_scripts:
            extra_args = ["--provider", args.provider]
        
        if run_script(script, log, extra_args):
            success += 1
            log.success(f"Completed: {name}")
        else:
            failed += 1
            log.error(f"Failed: {name}")
            if name in ["download", "cluster"]:
                log.warning("Stopping - core step failed")
                break
    
    # Summary
    log.summary(processed=success, errors=failed)
    
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
