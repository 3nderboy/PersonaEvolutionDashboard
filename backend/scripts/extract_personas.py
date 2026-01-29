"""
Cluster Persona Extraction Script
Generates cluster-level persona profiles by synthesizing individual user profiles using LLM.

Usage:
    python extract_personas.py                            # Use Ollama (default)
    python extract_personas.py --provider openai          # Use OpenAI
    python extract_personas.py --month "2025-03 (March)"  # Process specific month
"""

import argparse
from datetime import datetime
from collections import defaultdict
from pathlib import Path

from config import (
    SESSIONS_FILE,
    PERSONAS_FILE,
    USERS_DIR,
    CLUSTER_PERSONAS_DIR,
    CLUSTER_PERSONA_PROMPT,
)
from utils import LLMClient, load_json, write_json, read_file_safe, Logger
from models import ClusterPersona


def load_prompt() -> str:
    """Load the cluster persona synthesis prompt."""
    return read_file_safe(CLUSTER_PERSONA_PROMPT)


def load_sessions(log: Logger) -> list:
    """Load session data from sessions.json."""
    sessions = load_json(SESSIONS_FILE)
    log.detail("Sessions", len(sessions))
    return sessions


def load_personas(log: Logger) -> dict:
    """Load cluster persona metadata from personas.json."""
    personas = load_json(PERSONAS_FILE)
    log.detail("Clusters", len(personas))
    return {p["cluster_id"]: p for p in personas}


def load_user_profile(user_id: str) -> dict | None:
    """Load a user's profile from their JSON file."""
    user_file = USERS_DIR / f"{user_id}.json"
    if not user_file.exists():
        return None
    data = load_json(user_file)
    return data.get("profile", {})


def group_sessions_by_month_cluster(sessions: list) -> dict:
    """Group sessions by month and cluster_id."""
    groups = defaultdict(lambda: defaultdict(list))

    for session in sessions:
        month = session.get("month", "Unknown")
        cluster_id = session.get("cluster_id")
        if cluster_id is not None:
            groups[month][cluster_id].append(session)

    return groups


def aggregate_user_profiles(sessions: list) -> tuple[list, int]:
    """Collect unique user profiles for a list of sessions."""
    user_ids = set()
    profiles = []

    for session in sessions:
        user_id = session.get("user_id")
        if user_id and user_id not in user_ids:
            user_ids.add(user_id)
            profile = load_user_profile(user_id)
            if profile:
                profiles.append({"user_id": user_id, "profile": profile})

    return profiles, len(user_ids)


def format_cluster_info(cluster_meta: dict) -> str:
    """Format cluster metadata for the prompt."""
    if not cluster_meta:
        return "No cluster metadata available."

    lines = [
        f"Cluster Name: {cluster_meta.get('name', 'Unknown')}",
        f"Description: {cluster_meta.get('description', 'No description')}",
        f"Session Count: {cluster_meta.get('session_count', 'Unknown')}",
    ]

    metrics = cluster_meta.get("behavioral_metrics", {})
    if metrics:
        lines.append("\nBehavioral Metrics:")
        for metric, data in metrics.items():
            if isinstance(data, dict):
                value = data.get("value", "N/A")
                z_score = data.get("z_score", 0)
                lines.append(f"  - {metric}: {value:.2f} (z-score: {z_score:.2f})")

    traits = cluster_meta.get("distinguishing_traits", {})
    high_traits = traits.get("high", [])
    if high_traits:
        lines.append("\nDistinguishing Traits (High):")
        for trait in high_traits[:5]:
            lines.append(
                f"  - {trait.get('metric', 'unknown')}: z-score {trait.get('z_score', 0):.2f}"
            )

    return "\n".join(lines)


def format_user_profiles(profiles: list) -> str:
    """Format user profiles for the prompt."""
    if not profiles:
        return "No user profiles available for this cluster."

    lines = []
    for i, p in enumerate(profiles, 1):
        profile = p.get("profile", {})
        lines.append(f"\n--- User {i} ({p.get('user_id', 'unknown')[:8]}...) ---")

        demo = profile.get("demographics", {})
        if demo:
            lines.append("Demographics:")
            for key, val in demo.items():
                if isinstance(val, dict):
                    lines.append(f"  {key}: {val.get('value', 'N/A')}")
                else:
                    lines.append(f"  {key}: {val}")

        psych = profile.get("psychographics", {})
        if psych:
            lines.append("Psychographics:")
            for key, val in psych.items():
                if isinstance(val, dict):
                    v = val.get("value", "N/A")
                    if isinstance(v, list):
                        lines.append(f"  {key}: {', '.join(v[:5])}")
                    else:
                        lines.append(f"  {key}: {v}")

        shop = profile.get("shopping_behavior", {})
        if shop:
            lines.append("Shopping Behavior:")
            for key, val in shop.items():
                if isinstance(val, dict):
                    v = val.get("value", "N/A")
                    if isinstance(v, list):
                        lines.append(f"  {key}: {', '.join(v[:5])}")
                    else:
                        lines.append(f"  {key}: {v}")

    return "\n".join(lines)


def get_output_path(month: str, cluster_id: int) -> Path:
    """Get the output file path for a cluster persona."""
    safe_month = month.replace(" ", "_").replace("(", "").replace(")", "")
    return CLUSTER_PERSONAS_DIR / f"{safe_month}_cluster_{cluster_id}.json"


def is_already_processed(month: str, cluster_id: int) -> bool:
    """Check if cluster/month has already been processed."""
    return get_output_path(month, cluster_id).exists()


def save_cluster_persona(
    month: str,
    cluster_id: int,
    cluster_name: str,
    user_count: int,
    persona: ClusterPersona,
    source_users: list,
) -> Path:
    """Save generated cluster persona to JSON file."""
    CLUSTER_PERSONAS_DIR.mkdir(parents=True, exist_ok=True)

    output = {
        "cluster_id": cluster_id,
        "month": month,
        "cluster_name": cluster_name,
        "generated_at": datetime.now().isoformat(),
        "user_count": user_count,
        "persona": persona.model_dump(),
        "source_users": [
            {
                "user_id": u.get("user_id"),
                "summary": u.get("profile", {})
                .get("title", {})
                .get("two_word_summary", "Unknown"),
            }
            for u in source_users
        ],
    }

    output_path = get_output_path(month, cluster_id)
    write_json(output_path, output)
    return output_path


def main():
    parser = argparse.ArgumentParser(
        description="Generate cluster personas from user profiles"
    )
    parser.add_argument(
        "--provider",
        choices=["ollama", "openai"],
        default="ollama",
        help="LLM provider to use (default: ollama)",
    )
    parser.add_argument(
        "--month",
        type=str,
        default=None,
        help="Process only a specific month (e.g., '2025-03 (March)')",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Regenerate even if already processed",
    )
    args = parser.parse_args()

    log = Logger("extract_personas")
    log.header("Cluster Persona Generation")

    # Step 1: Initialize
    log.step(1, "Initializing")
    client = LLMClient(provider=args.provider)
    log.info(f"Provider: {args.provider.upper()} ({client.model_name})")

    base_prompt = load_prompt()
    log.success("Prompt loaded")

    # Step 2: Load data
    log.step(2, "Loading data")
    sessions = load_sessions(log)
    cluster_meta = load_personas(log)

    grouped = group_sessions_by_month_cluster(sessions)
    log.detail("Months", len(grouped))

    if args.month:
        if args.month not in grouped:
            log.error(f"Month '{args.month}' not found")
            log.info(f"Available: {', '.join(grouped.keys())}")
            return
        grouped = {args.month: grouped[args.month]}

    # Count work
    total_clusters = sum(len(clusters) for clusters in grouped.values())
    already_done = sum(
        1 for month, clusters in grouped.items()
        for cluster_id in clusters
        if not args.force and is_already_processed(month, cluster_id)
    )
    to_process = total_clusters - already_done

    log.info(f"Total clusters: {total_clusters}")
    if already_done > 0:
        log.info(f"Already processed: {already_done} (skipping)")
    log.info(f"To process: {to_process}")

    if to_process == 0:
        log.success("All personas already generated!")
        return

    # Step 3: Generate personas
    log.step(3, "Generating personas")
    errors = []
    processed = 0
    current = 0

    for month, clusters in grouped.items():
        for cluster_id, cluster_sessions in clusters.items():
            if not args.force and is_already_processed(month, cluster_id):
                continue

            current += 1
            cluster_name = cluster_meta.get(cluster_id, {}).get("name", f"C{cluster_id}")
            log.progress(current, to_process, f"{month[:7]} {cluster_name}")

            try:
                meta = cluster_meta.get(cluster_id, {})
                profiles, _ = aggregate_user_profiles(cluster_sessions)

                if not profiles:
                    log.warning(f"Cluster {cluster_id}: No user profiles")
                    continue

                user_count = len(profiles)
                cluster_info = format_cluster_info(meta)
                user_profiles_text = format_user_profiles(profiles)

                prompt = base_prompt.format(
                    cluster_info=cluster_info,
                    user_profiles=user_profiles_text,
                    user_count=user_count,
                )

                persona = client.extract(prompt, ClusterPersona)

                save_cluster_persona(
                    month=month,
                    cluster_id=cluster_id,
                    cluster_name=meta.get("name", f"Cluster {cluster_id}"),
                    user_count=user_count,
                    persona=persona,
                    source_users=profiles,
                )

                processed += 1

            except KeyboardInterrupt:
                print()
                log.warning("Interrupted! Run again to resume.")
                break

            except Exception as e:
                errors.append(
                    {"month": month, "cluster_id": cluster_id, "error": str(e)}
                )
                log.error(f"Cluster {cluster_id}: {e}")

    # Summary
    if errors:
        error_log = CLUSTER_PERSONAS_DIR / "persona_extraction_errors.json"
        write_json(error_log, errors)
        log.warning(f"Errors logged to {error_log.name}")

    log.summary(processed=processed, skipped=already_done, errors=len(errors))


if __name__ == "__main__":
    main()
