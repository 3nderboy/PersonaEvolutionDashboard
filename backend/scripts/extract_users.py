"""
User Profile Extraction Script
Extracts structured user profile data from OPeRA interview transcripts using LLM.

Usage:
    python extract_users.py                    # Use Ollama (default)
    python extract_users.py --provider openai  # Use OpenAI

Features:
    - Resumable: Skips already processed users
    - Progress: Shows [current/total] counter
    - Interrupt: Ctrl+C safe, progress is saved
    
Output:
    frontend/public/data/users/{user_id}.json
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

DATA_DIR = Path(__file__).parent.parent / "data" / "NEU-HAI__OPeRA" / "filtered_user"
OUTPUT_DIR = Path(__file__).parent.parent.parent / "frontend" / "public" / "data" / "users"

# --- Prompt Template ---
SYSTEM_PROMPT = """
You are a user profile extraction expert. Analyze the interview transcript and extract a structured user profile.
Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "title": {
    "user_name": "user_id",
    "two_word_summary": "two words",
    "confidence_overall": "0.00-1.00"
  },
  "demographics": {
    "age_range": {
      "value": "age in a range of 5 years or null",
      "confidence": "0.00-1.00",
      "evidence": "quote/snippet or null"
    },
    "gender": {
      "value": "Male / Female / Unknown or null",
      "confidence": "0.00-1.00",
      "evidence": "quote/snippet or null"
    },
    "nationality_background": {
      "value": "USA / Country / Continent / Unknown or null",
      "confidence": "0.00-1.00",
      "evidence": "quote/snippet or null"
    },
    "location": {
      "value": "place of residence or null",
      "confidence": "0.00-1.00",
      "evidence": "quote/snippet or null"
    },
    "living_situation": {
      "value": "Alone / With Friend / With Partner / With Friends / With Parents / With Relatives / Unknown or null",
      "confidence": "0.00-1.00",
      "evidence": "quote/snippet or null"
    },
    "occupation": {
      "value": "job or null",
      "confidence": "0.00-1.00",
      "evidence": "quote/snippet or null"
    },
    "education": {
      "value": "education level or null",
      "confidence": "0.00-1.00",
      "evidence": "quote/snippet or null"
    }
  },
  "psychographics": {
    "goals_and_motivations": {
      "value": "string (general goals/motivations) or null",
      "confidence": "0.00-1.00",
      "evidence": "quote/snippet or null"
    },
    "interests": {
      "value": ["interest 1", "interest 2", "interest 3"],
      "confidence": "0.00-1.00",
      "evidence": "quote/snippet or null"
    },
    "values": {
      "value": ["value 1", "value 2", "value 3"],
      "confidence": "0.00-1.00",
      "evidence": "quote/snippet or null"
    }
  },
  "shopping_behavior": {
    "frequency_of_use": {
      "value": "Several times a day / Once a day / Weekly / Monthly / Very rarely / Unknown or null",
      "confidence": "0.00-1.00",
      "evidence": "quote/snippet or null"
    },
    "where_used_devices": {
      "value": ["Smartphone", "Tablet", "Desktop", "Unknown"],
      "confidence": "0.00-1.00",
      "evidence": "quote/snippet or null"
    },
    "search_style_best_vs_first": {
      "value": "Best Product / First Product / Unknown or null",
      "confidence": "0.00-1.00",
      "evidence": "quote/snippet or null"
    },
    "price_preference_cheapest_vs_expensive": {
      "value": "Cheapest Product / Most Expensive Product / Unknown or null",
      "confidence": "0.00-1.00",
      "evidence": "quote/snippet or null"
    },
    "decision_factors": {
      "value": ["factor 1", "factor 2", "factor 3"],
      "confidence": "0.00-1.00",
      "evidence": "quote/snippet or null"
    },
    "preferred_categories": {
      "value": ["category 1", "category 2", "category 3"],
      "confidence": "0.00-1.00",
      "evidence": "quote/snippet or null"
    },
    "pain_points_and_or_challenges": {
      "value": "most important pain point or null",
      "confidence": "0.00-1.00",
      "evidence": "quote/snippet or null"
    }
  }
}

Extract ONLY what is explicitly stated or clearly implied in the interview_transcript. 
Use null for unknown fields. 
For age_range, gender and nationality_background you can interpret these three values strongly and choose the most appropriate one. 
But no sensitive attributions without basis. 
However, a value should always be assumed for age_range and gender in particular, even if no value can be clearly read.
"""

def validate_utf8(text: str) -> str:
    """Ensure text is valid UTF-8, replacing invalid characters."""
    if not isinstance(text, str):
        return ""
    return text.encode('utf-8', 'replace').decode('utf-8')

# Ensure SYSTEM_PROMPT is valid UTF-8
SYSTEM_PROMPT = validate_utf8(SYSTEM_PROMPT)


def extract_with_ollama(transcript: str) -> dict:
    """Call Ollama API for extraction."""
    response = requests.post(
        OLLAMA_URL,
        json={
            "model": OLLAMA_MODEL,
            "prompt": f"{SYSTEM_PROMPT}\n\n--- TRANSCRIPT ---\n{validate_utf8(transcript)}\n--- END TRANSCRIPT ---",
            "stream": False,
            "format": "json"
        },
        timeout=360
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
            {"role": "user", "content": f"--- TRANSCRIPT ---\n{validate_utf8(transcript)}\n--- END TRANSCRIPT ---"}
        ],
        response_format={"type": "json_object"},
        timeout=60
    )
    
    return json.loads(response.choices[0].message.content)


def load_users() -> pd.DataFrame:
    """Load user data with interview transcripts."""
    csv_files = list(DATA_DIR.glob("*.csv"))
    if not csv_files:
        raise FileNotFoundError(f"No CSV files found in {DATA_DIR}")
    
    dfs = []
    for csv_path in csv_files:
        print(f"    Loading {csv_path.name}...")
        try:
            df_chunk = pd.read_csv(csv_path)
            dfs.append(df_chunk)
        except Exception as e:
            print(f"[ERR] Failed to load {csv_path.name}: {e}")

    if not dfs:
        return pd.DataFrame()
        
    df = pd.concat(dfs, ignore_index=True)
    
    # Filter to users with interview transcripts
    df = df[df["interview_transcript"].notna() & (df["interview_transcript"] != "")]
    return df


def get_output_path(user_id: str) -> Path:
    """Get the output file path for a user."""
    return OUTPUT_DIR / f"{user_id}.json"


def is_already_processed(user_id: str) -> bool:
    """Check if user has already been processed."""
    return get_output_path(user_id).exists()


def save_user_profile(user_id: str, profile: dict, survey_data: str = None):
    """Save extracted user profile to JSON file."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    output = {
        "user_id": user_id,
        "profile": profile,
        "survey_data": survey_data
    }
    
    output_path = get_output_path(user_id)
    output_path.write_text(json.dumps(output, indent=2, ensure_ascii=False))


def main():
    parser = argparse.ArgumentParser(description="Extract user profiles from interview transcripts")
    parser.add_argument("--provider", choices=["ollama", "openai"], default="ollama",
                        help="LLM provider to use (default: ollama)")
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
    
    # Load users
    print("[*] Loading user data...")
    users_df = load_users()
    total = len(users_df)
    print(f"    Found {total} users with interview transcripts")
    
    # Count already processed
    already_done = sum(1 for _, row in users_df.iterrows() 
                       if is_already_processed(row["user_id"]))
    if already_done > 0:
        print(f"[*] Skipping {already_done} already processed users")
    
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
            
            # Handle NaN survey data (common in pandas)
            if pd.isna(survey):
                survey = None
            
            profile = extract_fn(transcript)
            save_user_profile(user_id, profile, survey)
            processed += 1
            
        except KeyboardInterrupt:
            print(f"\n[!] Interrupted! Processed {processed} new users.")
            print("    Run again to resume from where you left off.")
            break
            
        except Exception as e:
            errors.append({"user_id": user_id, "error": str(e)})
            tqdm.write(f"[ERR] Error for {user_id}: {e}")
    
    # Save errors log
    if errors:
        error_log = OUTPUT_DIR / "extraction_errors.json"
        error_log.write_text(json.dumps(errors, indent=2))
        print(f"[!] {len(errors)} errors logged to {error_log}")
    
    print(f"\n[DONE] Processed {processed} new users.")


if __name__ == "__main__":
    main()
