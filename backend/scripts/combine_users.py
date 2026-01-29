"""
Combine Individual User Profile Files

Combines all individual {user_id}.json user profile files into a single llm_users.json
file that the frontend expects.

Usage:
    python combine_users.py
"""

from config import USERS_DIR
from utils import load_json, write_json, Logger


def main():
    log = Logger("combine_users")
    log.header("Combine User Profiles")

    log.step(1, "Scanning for files")
    
    excluded_files = {"llm_users.json", "extraction_errors.json"}
    user_files = [
        f for f in USERS_DIR.glob("*.json") if f.name not in excluded_files
    ]

    if not user_files:
        log.warning("No user profile files found!")
        return

    log.info(f"Found {len(user_files)} user profile files")

    log.step(2, "Loading profiles")
    users = []
    errors = 0
    
    for i, file_path in enumerate(user_files, 1):
        log.progress(i, len(user_files), file_path.name[:12])
        try:
            data = load_json(file_path)
            users.append(data)
        except Exception as e:
            errors += 1
            log.error(f"{file_path.name}: {e}")

    log.step(3, "Writing combined file")
    output_file = USERS_DIR / "llm_users.json"
    write_json(output_file, users)
    log.success(f"Created {output_file.name}")

    log.summary(processed=len(users), errors=errors)


if __name__ == "__main__":
    main()
