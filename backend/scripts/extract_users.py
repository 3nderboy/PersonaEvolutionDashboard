"""
User Profile Extraction Script
Extracts structured user profile data from OPeRA interview transcripts using LLM.

Usage:
    python extract_users.py                    # Use Ollama (default)
    python extract_users.py --provider openai  # Use OpenAI
"""

import argparse
from pathlib import Path

import pandas as pd

from config import DATA_DIR, USERS_DIR, USER_PROFILE_PROMPT
from utils import LLMClient, read_file_safe, write_json, Logger
from models import UserProfile


def load_prompt() -> str:
    """Load the user profile extraction prompt."""
    return read_file_safe(USER_PROFILE_PROMPT)


def load_users(log: Logger) -> pd.DataFrame:
    """Load user data with interview transcripts."""
    csv_files = list(DATA_DIR.glob("*.csv"))
    
    if not csv_files:
        raise FileNotFoundError(f"No CSV files found in {DATA_DIR}")

    dfs = []
    for csv_path in csv_files:
        log.detail("Loading", csv_path.name)
        try:
            df_chunk = pd.read_csv(csv_path)
            dfs.append(df_chunk)
        except Exception as e:
            log.error(f"Failed to load {csv_path.name}: {e}")

    if not dfs:
        return pd.DataFrame()

    df = pd.concat(dfs, ignore_index=True)
    df = df[df["interview_transcript"].notna() & (df["interview_transcript"] != "")]
    return df


def get_output_path(user_id: str) -> Path:
    """Get the output file path for a user."""
    return USERS_DIR / f"{user_id}.json"


def is_already_processed(user_id: str) -> bool:
    """Check if user has already been processed."""
    return get_output_path(user_id).exists()


def save_user_profile(user_id: str, profile: UserProfile):
    """Save extracted user profile to JSON file."""
    USERS_DIR.mkdir(parents=True, exist_ok=True)

    output = {
        "user_id": user_id,
        "profile": profile.model_dump(),
    }

    write_json(get_output_path(user_id), output)


def main():
    parser = argparse.ArgumentParser(
        description="Extract user profiles from interview transcripts"
    )
    parser.add_argument(
        "--provider",
        choices=["ollama", "openai"],
        default="ollama",
        help="LLM provider to use (default: ollama)",
    )
    args = parser.parse_args()

    log = Logger("extract_users")
    log.header("User Profile Extraction")

    # Step 1: Initialize
    log.step(1, "Initializing")
    client = LLMClient(provider=args.provider)
    log.info(f"Provider: {args.provider.upper()} ({client.model_name})")

    base_prompt = load_prompt()
    log.success("Prompt loaded")

    # Step 2: Load data
    log.step(2, "Loading user data")
    users_df = load_users(log)
    total = len(users_df)
    log.info(f"Found {total} users with interview transcripts")

    already_done = sum(
        1 for _, row in users_df.iterrows() if is_already_processed(row["user_id"])
    )
    to_process = total - already_done
    if already_done > 0:
        log.info(f"Already processed: {already_done} (skipping)")
    log.info(f"To process: {to_process}")

    if to_process == 0:
        log.success("All users already processed!")
        return

    # Step 3: Extract profiles
    log.step(3, f"Extracting profiles")
    errors = []
    processed = 0
    current = 0

    for _, row in users_df.iterrows():
        user_id = row["user_id"]

        if is_already_processed(user_id):
            continue

        current += 1
        log.progress(current, to_process, user_id[:8])

        try:
            transcript = row["interview_transcript"]

            prompt = f"{base_prompt}\n\n--- TRANSCRIPT ---\n{transcript}\n--- END TRANSCRIPT ---"

            profile = client.extract(prompt, UserProfile)
            save_user_profile(user_id, profile)
            processed += 1

        except KeyboardInterrupt:
            print()  # Clear progress line
            log.warning(f"Interrupted! Run again to resume.")
            break

        except Exception as e:
            errors.append({"user_id": user_id, "error": str(e)})
            log.error(f"{user_id[:8]}: {e}")

    # Summary
    if errors:
        error_log = USERS_DIR / "extraction_errors.json"
        write_json(error_log, errors)
        log.warning(f"Errors logged to {error_log.name}")

    log.summary(processed=processed, skipped=already_done, errors=len(errors))


if __name__ == "__main__":
    main()
