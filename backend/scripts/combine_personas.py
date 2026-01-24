"""
Combine Individual Persona Files

Combines all individual {user_id}.json persona files into a single llm_personas.json
file that the frontend expects.

Usage:
    python combine_personas.py
"""

import json
from pathlib import Path

# Paths
PERSONAS_DIR = Path(__file__).parent.parent.parent / "frontend" / "public" / "data" / "personas"
OUTPUT_FILE = PERSONAS_DIR / "llm_personas.json"

def main():
    print("[*] Scanning for persona files...")
    
    # Find all individual persona JSON files (exclude special files)
    excluded_files = {
        "llm_personas.json",
        "personas.json", 
        "metadata.json",
        "monthly_clusters.json",
        "sessions.json",
        "extraction_errors.json"
    }
    
    persona_files = [
        f for f in PERSONAS_DIR.glob("*.json")
        if f.name not in excluded_files
    ]
    
    if not persona_files:
        print("[!] No persona files found!")
        return
    
    print(f"    Found {len(persona_files)} persona file(s)")
    
    # Load and combine all personas
    personas = []
    for file_path in persona_files:
        try:
            # Try UTF-8 first, fall back to cp1252 (Windows default)
            try:
                text = file_path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                text = file_path.read_text(encoding="cp1252")
            data = json.loads(text)
            personas.append(data)
            print(f"    [OK] Loaded {file_path.name}")
        except Exception as e:
            print(f"    [ERR] Error loading {file_path.name}: {e}")
    
    # Write combined file
    OUTPUT_FILE.write_text(json.dumps(personas, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n[DONE] Combined {len(personas)} personas into {OUTPUT_FILE.name}")

if __name__ == "__main__":
    main()
