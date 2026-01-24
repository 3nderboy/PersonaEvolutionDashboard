"""
Combine Individual User Profile Files

Combines all individual {user_id}.json user profile files into a single llm_users.json
file that the frontend expects.

Usage:
    python combine_users.py
"""

import json
from pathlib import Path

# Paths
USERS_DIR = Path(__file__).parent.parent.parent / "frontend" / "public" / "data" / "users"
OUTPUT_FILE = USERS_DIR / "llm_users.json"

def main():
    print("[*] Scanning for user profile files...")
    
    # Find all individual user JSON files (exclude special files)
    excluded_files = {
        "llm_users.json",
        "extraction_errors.json"
    }
    
    user_files = [
        f for f in USERS_DIR.glob("*.json")
        if f.name not in excluded_files
    ]
    
    if not user_files:
        print("[!] No user profile files found!")
        return
    
    print(f"    Found {len(user_files)} user profile file(s)")
    
    # Load and combine all user profiles
    users = []
    for file_path in user_files:
        try:
            # Try UTF-8 first, fall back to cp1252 (Windows default)
            try:
                text = file_path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                text = file_path.read_text(encoding="cp1252")
            data = json.loads(text)
            users.append(data)
            print(f"    [OK] Loaded {file_path.name}")
        except Exception as e:
            print(f"    [ERR] Error loading {file_path.name}: {e}")
    
    # Write combined file
    OUTPUT_FILE.write_text(json.dumps(users, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"\n[DONE] Combined {len(users)} user profiles into {OUTPUT_FILE.name}")

if __name__ == "__main__":
    main()
