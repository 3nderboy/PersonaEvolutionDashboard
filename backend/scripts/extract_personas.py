"""
Persona Extraction Script
Extracts structured persona data from OPeRA interview transcripts using LLM.

Usage:
    python extract_personas.py                    # Use Ollama (default)
    python extract_personas.py --provider openai  # Use OpenAI

Features:
    - Resumable: Skips already processed users
    - Progress: Shows [current/total] counter
    - Interrupt: Ctrl+C safe, progress is saved
    
Output:
    frontend/public/data/personas/{user_id}.json
"""

import os
import json
import argparse
from pathlib import Path

import pandas as pd
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

DATA_DIR = Path(__file__).parent.parent / "data" / "NEU-HAI__OPeRA"
OUTPUT_DIR = Path(__file__).parent.parent.parent / "frontend" / "public" / "data" / "personas"

# --- Prompt Template ---
SYSTEM_PROMPT = """You are a persona extraction expert. Analyze the interview transcript and extract a structured persona.

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "demographics": {
    "age_range": "string or null",
    "gender": "string or null",
    "location": "string or null",
    "occupation": "string or null",
    "education": "string or null",
    "living_situation": "string or null"
  },
  "psychographics": {
    "personality_traits": ["list of traits"],
    "interests": ["list of interests"],
    "values": ["list of values"],
    "lifestyle": "string description"
  },
  "shopping_behavior": {
    "frequency": "string",
    "preferred_categories": ["list"],
    "decision_factors": ["list of factors they consider"],
    "research_habits": "string description",
    "brand_loyalty": "string (high/medium/low)"
  },
  "narrative": "A 2-3 sentence summary of this persona in third person"
}

Extract ONLY what is explicitly stated or clearly implied in the transcript. Use null for unknown fields."""


def extract_with_ollama(transcript: str) -> dict:
    """Call Ollama API for extraction."""
    response = requests.post(
        OLLAMA_URL,
        json={
            "model": OLLAMA_MODEL,
            "prompt": f"{SYSTEM_PROMPT}\n\n--- TRANSCRIPT ---\n{transcript}\n--- END TRANSCRIPT ---",
            "stream": False,
            "format": "json"
        },
        timeout=120
    )
    response.raise_for_status()
    result = response.json()
    return json.loads(result["response"])


def extract_with_openai(transcript: str) -> dict:
    """Call OpenAI API for extraction."""
    import openai
    
    client = openai.OpenAI(api_key=OPENAI_API_KEY)
    
    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"--- TRANSCRIPT ---\n{transcript}\n--- END TRANSCRIPT ---"}
        ],
        response_format={"type": "json_object"},
        timeout=60
    )
    
    return json.loads(response.choices[0].message.content)


def load_users() -> pd.DataFrame:
    """Load user data with interview transcripts."""
    csv_path = DATA_DIR / "user.csv"
    if not csv_path.exists():
        raise FileNotFoundError(f"User data not found at {csv_path}")
    
    df = pd.read_csv(csv_path)
    # Filter to users with interview transcripts
    df = df[df["interview_transcript"].notna() & (df["interview_transcript"] != "")]
    return df


def get_output_path(user_id: str) -> Path:
    """Get the output file path for a user."""
    return OUTPUT_DIR / f"{user_id}.json"


def is_already_processed(user_id: str) -> bool:
    """Check if user has already been processed."""
    return get_output_path(user_id).exists()


def save_persona(user_id: str, persona: dict, survey_data: str = None):
    """Save extracted persona to JSON file."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    output = {
        "user_id": user_id,
        "persona": persona,
        "survey_data": survey_data
    }
    
    output_path = get_output_path(user_id)
    output_path.write_text(json.dumps(output, indent=2, ensure_ascii=False))


def main():
    parser = argparse.ArgumentParser(description="Extract personas from interview transcripts")
    parser.add_argument("--provider", choices=["ollama", "openai"], default="ollama",
                        help="LLM provider to use (default: ollama)")
    args = parser.parse_args()
    
    # Select extraction function
    if args.provider == "openai":
        if not OPENAI_API_KEY:
            print("❌ OPENAI_API_KEY not set in environment")
            return
        extract_fn = extract_with_openai
        print(f"🔑 Using OpenAI ({OPENAI_MODEL})")
    else:
        extract_fn = extract_with_ollama
        print(f"🦙 Using Ollama ({OLLAMA_MODEL})")
    
    # Load users
    print("📂 Loading user data...")
    users_df = load_users()
    total = len(users_df)
    print(f"   Found {total} users with interview transcripts")
    
    # Count already processed
    already_done = sum(1 for _, row in users_df.iterrows() 
                       if is_already_processed(row["user_id"]))
    if already_done > 0:
        print(f"⏭️  Skipping {already_done} already processed users")
    
    # Process users
    errors = []
    processed = 0
    
    for idx, row in tqdm(users_df.iterrows(), total=total, desc="Extracting"):
        user_id = row["user_id"]
        
        if is_already_processed(user_id):
            continue
        
        try:
            transcript = row["interview_transcript"]
            survey = row.get("survey", None)
            
            persona = extract_fn(transcript)
            save_persona(user_id, persona, survey)
            processed += 1
            
        except KeyboardInterrupt:
            print(f"\n⚠️ Interrupted! Processed {processed} new users.")
            print("   Run again to resume from where you left off.")
            break
            
        except Exception as e:
            errors.append({"user_id": user_id, "error": str(e)})
            tqdm.write(f"❌ Error for {user_id}: {e}")
    
    # Save errors log
    if errors:
        error_log = OUTPUT_DIR / "extraction_errors.json"
        error_log.write_text(json.dumps(errors, indent=2))
        print(f"⚠️ {len(errors)} errors logged to {error_log}")
    
    print(f"\n✅ Done! Processed {processed} new users.")


if __name__ == "__main__":
    main()
