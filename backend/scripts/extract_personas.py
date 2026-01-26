"""
Cluster Persona Extraction Script
Generates cluster-level persona profiles by synthesizing individual user profiles using LLM.

Usage:
    python extract_personas.py                            # Use Ollama (default)
    python extract_personas.py --provider openai          # Use OpenAI
    python extract_personas.py --month "2025-03 (March)"  # Process specific month

Features:
    - Generates one persona per cluster per month
    - Aggregates user profiles from all sessions in a cluster
    - Resumable: Skips already processed cluster/month combinations
    
Output:
    frontend/public/data/personas/cluster_personas/{month}_{cluster_id}.json
"""

import os
import json
import argparse
from pathlib import Path
from datetime import datetime
from collections import defaultdict

import requests
from tqdm import tqdm
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- Configuration ---
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma3")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# Paths
SCRIPT_DIR = Path(__file__).parent
DATA_DIR = SCRIPT_DIR.parent.parent / "frontend" / "public" / "data"
SESSIONS_FILE = DATA_DIR / "personas" / "sessions.json"
PERSONAS_FILE = DATA_DIR / "personas" / "personas.json"
USERS_DIR = DATA_DIR / "users"
OUTPUT_DIR = DATA_DIR / "personas" / "cluster_personas"

# --- Prompt Template ---
SYSTEM_PROMPT = """
You are a persona synthesis expert. Given multiple individual user profiles from an e-commerce behavioral cluster, 
synthesize a single representative persona that captures the common patterns, characteristics, and behaviors of this user group.

The cluster has the following behavioral characteristics:
{cluster_info}

Here are the individual user profiles from this cluster:
{user_profiles}

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{{
  "title": {{
    "persona_name": "A memorable persona name (e.g., 'The Pragmatic Professional')",
    "tagline": "A short 5-10 word description of this persona"
  }},
  "demographics": {{
    "age_distribution": "Describe the age range pattern (e.g., 'Predominantly 25-34 years old')",
    "gender_distribution": "Describe gender mix (e.g., 'Majority female' or 'Equal mix')",
    "education_level": "Common education patterns",
    "occupation_types": ["occupation 1", "occupation 2"],
    "location_pattern": "Geographic patterns (e.g., 'Urban areas, primarily Boston')"
  }},
  "psychographics": {{
    "common_goals": ["goal shared by multiple users", "another common goal"],
    "shared_interests": ["interest 1", "interest 2", "interest 3"],
    "shared_values": ["value 1", "value 2", "value 3"]
  }},
  "shopping_behavior": {{
    "frequency_pattern": "How often this group shops (e.g., 'Weekly shoppers')",
    "preferred_devices": ["device 1", "device 2"],
    "decision_style": "How they make purchase decisions",
    "price_sensitivity": "Their price preferences",
    "common_pain_points": ["pain point 1", "pain point 2"]
  }},
  "narrative": "A 2-3 sentence narrative description of a typical member of this persona group. Make it vivid and human."
}}

Synthesize patterns across ALL provided user profiles. Focus on commonalities, but note significant variations where relevant.
If a field has no clear pattern across users, indicate "Varied" or provide the range of observed values.
"""


def validate_utf8(text: str) -> str:
    """Ensure text is valid UTF-8, replacing invalid characters."""
    if not isinstance(text, str):
        return ""
    return text.encode('utf-8', 'replace').decode('utf-8')


def extract_with_ollama(prompt: str) -> dict:
    """Call Ollama API for extraction."""
    response = requests.post(
        OLLAMA_URL,
        json={
            "model": OLLAMA_MODEL,
            "prompt": validate_utf8(prompt),
            "stream": False,
            "format": "json"
        },
        timeout=600  # Longer timeout for synthesis
    )
    response.raise_for_status()
    result = response.json()
    return json.loads(result["response"])


def extract_with_openai(prompt: str) -> dict:
    """Call OpenAI API for extraction."""
    import openai
    
    client = openai.OpenAI(api_key=OPENAI_API_KEY)
    
    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": "You are a persona synthesis expert."},
            {"role": "user", "content": validate_utf8(prompt)}
        ],
        response_format={"type": "json_object"},
        timeout=120
    )
    
    return json.loads(response.choices[0].message.content)


def load_sessions() -> list:
    """Load session data from sessions.json."""
    print(f"[*] Loading sessions from {SESSIONS_FILE}...")
    content = read_file_with_fallback(SESSIONS_FILE)
    sessions = json.loads(content)
    print(f"    Found {len(sessions)} sessions")
    return sessions


def load_personas() -> dict:
    """Load cluster persona metadata from personas.json."""
    print(f"[*] Loading cluster metadata from {PERSONAS_FILE}...")
    content = read_file_with_fallback(PERSONAS_FILE)
    personas = json.loads(content)
    # Index by cluster_id
    return {p['cluster_id']: p for p in personas}


def read_file_with_fallback(file_path: Path) -> str:
    """
    Read a file trying multiple encodings.
    Handles Windows-1252 characters (like curly quotes) that may appear in user data.
    """
    encodings = ['utf-8', 'utf-8-sig', 'cp1252', 'latin-1']
    
    for encoding in encodings:
        try:
            with open(file_path, 'r', encoding=encoding) as f:
                content = f.read()
            # If we successfully read with a non-UTF8 encoding, 
            # normalize special characters to their UTF-8 equivalents
            if encoding != 'utf-8':
                # Replace common Windows-1252 characters with UTF-8 equivalents
                replacements = {
                    '\x92': "'",   # Right single quote
                    '\x91': "'",   # Left single quote
                    '\x93': '"',   # Left double quote
                    '\x94': '"',   # Right double quote
                    '\x96': '-',   # En dash
                    '\x97': '-',   # Em dash
                    '\x85': '...', # Ellipsis
                }
                for old, new in replacements.items():
                    content = content.replace(old, new)
            return content
        except (UnicodeDecodeError, LookupError):
            continue
    
    # Last resort: read as binary and decode with replacement
    with open(file_path, 'rb') as f:
        return f.read().decode('utf-8', errors='replace')


def load_user_profile(user_id: str) -> dict | None:
    """Load a user's profile from their JSON file."""
    user_file = USERS_DIR / f"{user_id}.json"
    if not user_file.exists():
        return None
    
    content = read_file_with_fallback(user_file)
    data = json.loads(content)
    
    return data.get('profile', {})


def group_sessions_by_month_cluster(sessions: list) -> dict:
    """Group sessions by month and cluster_id."""
    groups = defaultdict(lambda: defaultdict(list))
    
    for session in sessions:
        month = session.get('month', 'Unknown')
        cluster_id = session.get('cluster_id')
        if cluster_id is not None:
            groups[month][cluster_id].append(session)
    
    return groups


def aggregate_user_profiles(sessions: list) -> tuple[list, int]:
    """
    Collect unique user profiles for a list of sessions.
    Returns (list of profile dicts, count of unique users with profiles).
    """
    user_ids = set()
    profiles = []
    
    for session in sessions:
        user_id = session.get('user_id')
        if user_id and user_id not in user_ids:
            user_ids.add(user_id)
            profile = load_user_profile(user_id)
            if profile:
                profiles.append({
                    'user_id': user_id,
                    'profile': profile
                })
    
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
    
    # Add behavioral metrics if available
    metrics = cluster_meta.get('behavioral_metrics', {})
    if metrics:
        lines.append("\nBehavioral Metrics:")
        for metric, data in metrics.items():
            if isinstance(data, dict):
                value = data.get('value', 'N/A')
                z_score = data.get('z_score', 0)
                lines.append(f"  - {metric}: {value:.2f} (z-score: {z_score:.2f})")
    
    # Add distinguishing traits
    traits = cluster_meta.get('distinguishing_traits', {})
    high_traits = traits.get('high', [])
    if high_traits:
        lines.append("\nDistinguishing Traits (High):")
        for trait in high_traits[:5]:
            lines.append(f"  - {trait.get('metric', 'unknown')}: z-score {trait.get('z_score', 0):.2f}")
    
    return "\n".join(lines)


def format_user_profiles(profiles: list) -> str:
    """Format user profiles for the prompt."""
    if not profiles:
        return "No user profiles available for this cluster."
    
    lines = []
    for i, p in enumerate(profiles, 1):
        profile = p.get('profile', {})
        lines.append(f"\n--- User {i} ({p.get('user_id', 'unknown')[:8]}...) ---")
        
        # Demographics
        demo = profile.get('demographics', {})
        if demo:
            lines.append("Demographics:")
            for key, val in demo.items():
                if isinstance(val, dict):
                    lines.append(f"  {key}: {val.get('value', 'N/A')}")
                else:
                    lines.append(f"  {key}: {val}")
        
        # Psychographics
        psych = profile.get('psychographics', {})
        if psych:
            lines.append("Psychographics:")
            for key, val in psych.items():
                if isinstance(val, dict):
                    v = val.get('value', 'N/A')
                    if isinstance(v, list):
                        lines.append(f"  {key}: {', '.join(v[:5])}")
                    else:
                        lines.append(f"  {key}: {v}")
        
        # Shopping Behavior
        shop = profile.get('shopping_behavior', {})
        if shop:
            lines.append("Shopping Behavior:")
            for key, val in shop.items():
                if isinstance(val, dict):
                    v = val.get('value', 'N/A')
                    if isinstance(v, list):
                        lines.append(f"  {key}: {', '.join(v[:5])}")
                    else:
                        lines.append(f"  {key}: {v}")
    
    return "\n".join(lines)


def get_output_path(month: str, cluster_id: int) -> Path:
    """Get the output file path for a cluster persona."""
    # Sanitize month for filename
    safe_month = month.replace(" ", "_").replace("(", "").replace(")", "")
    return OUTPUT_DIR / f"{safe_month}_cluster_{cluster_id}.json"


def is_already_processed(month: str, cluster_id: int) -> bool:
    """Check if cluster/month has already been processed."""
    return get_output_path(month, cluster_id).exists()


def save_cluster_persona(
    month: str,
    cluster_id: int,
    cluster_name: str,
    user_count: int,
    persona: dict,
    source_users: list
):
    """Save generated cluster persona to JSON file."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    output = {
        "cluster_id": cluster_id,
        "month": month,
        "cluster_name": cluster_name,
        "generated_at": datetime.now().isoformat(),
        "user_count": user_count,
        "persona": persona,
        "source_users": [
            {
                "user_id": u.get('user_id'),
                "summary": u.get('profile', {}).get('title', {}).get('two_word_summary', 'Unknown')
            }
            for u in source_users
        ]
    }
    
    output_path = get_output_path(month, cluster_id)
    output_path.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding='utf-8')
    return output_path


def main():
    parser = argparse.ArgumentParser(description="Generate cluster personas from user profiles")
    parser.add_argument("--provider", choices=["ollama", "openai"], default="ollama",
                        help="LLM provider to use (default: ollama)")
    parser.add_argument("--month", type=str, default=None,
                        help="Process only a specific month (e.g., '2025-03 (March)')")
    parser.add_argument("--force", action="store_true",
                        help="Regenerate even if already processed")
    args = parser.parse_args()
    
    # Select extraction function
    if args.provider == "openai":
        if not OPENAI_API_KEY:
            print("[ERR] OPENAI_API_KEY not set in environment")
            return
        extract_fn = extract_with_openai
        print(f"[*] Using OpenAI ({OPENAI_MODEL})")
    else:
        extract_fn = extract_with_ollama
        print(f"[*] Using Ollama ({OLLAMA_MODEL})")
    
    # Load data
    sessions = load_sessions()
    cluster_meta = load_personas()
    
    # Group sessions
    grouped = group_sessions_by_month_cluster(sessions)
    print(f"[*] Found {len(grouped)} months with cluster data")
    
    # Filter to specific month if requested
    if args.month:
        if args.month not in grouped:
            print(f"[ERR] Month '{args.month}' not found. Available months: {list(grouped.keys())}")
            return
        grouped = {args.month: grouped[args.month]}
    
    # Count total work
    total_clusters = sum(len(clusters) for clusters in grouped.values())
    print(f"[*] Processing {total_clusters} cluster/month combinations")
    
    # Process each month/cluster
    errors = []
    processed = 0
    skipped = 0
    
    for month, clusters in grouped.items():
        print(f"\n[*] Processing {month}...")
        
        for cluster_id, cluster_sessions in tqdm(clusters.items(), desc=f"  {month}"):
            # Skip if already processed
            if not args.force and is_already_processed(month, cluster_id):
                skipped += 1
                continue
            
            try:
                # Get cluster metadata
                meta = cluster_meta.get(cluster_id, {})
                cluster_name = meta.get('name', f'Cluster {cluster_id}')
                
                # Aggregate user profiles
                profiles, user_count = aggregate_user_profiles(cluster_sessions)
                
                if not profiles:
                    tqdm.write(f"    [SKIP] Cluster {cluster_id}: No user profiles available")
                    continue
                
                # Build prompt
                cluster_info = format_cluster_info(meta)
                user_profiles_text = format_user_profiles(profiles)
                
                prompt = SYSTEM_PROMPT.format(
                    cluster_info=cluster_info,
                    user_profiles=user_profiles_text
                )
                
                # Generate persona
                persona = extract_fn(prompt)
                
                # Save output
                output_path = save_cluster_persona(
                    month=month,
                    cluster_id=cluster_id,
                    cluster_name=cluster_name,
                    user_count=user_count,
                    persona=persona,
                    source_users=profiles
                )
                
                processed += 1
                tqdm.write(f"    [OK] Cluster {cluster_id} ({cluster_name}): {len(profiles)} users -> {output_path.name}")
                
            except KeyboardInterrupt:
                print(f"\n[!] Interrupted! Processed {processed} personas.")
                print("    Run again to resume from where you left off.")
                break
                
            except Exception as e:
                errors.append({
                    "month": month,
                    "cluster_id": cluster_id,
                    "error": str(e)
                })
                tqdm.write(f"    [ERR] Cluster {cluster_id}: {e}")
    
    # Summary
    print(f"\n[DONE]")
    print(f"    Processed: {processed}")
    print(f"    Skipped (already done): {skipped}")
    print(f"    Errors: {len(errors)}")
    
    # Save errors log
    if errors:
        error_log = OUTPUT_DIR / "persona_extraction_errors.json"
        error_log.write_text(json.dumps(errors, indent=2), encoding='utf-8')
        print(f"[!] Errors logged to {error_log}")


if __name__ == "__main__":
    main()
