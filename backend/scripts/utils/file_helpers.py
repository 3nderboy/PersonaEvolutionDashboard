"""
File I/O utilities with robust encoding handling.
"""

import json
from pathlib import Path


def read_file_safe(file_path: Path) -> str:
    """
    Read a file trying multiple encodings.
    Handles Windows-1252 characters (like curly quotes) that may appear in user data.
    """
    encodings = ["utf-8", "utf-8-sig", "cp1252", "latin-1"]

    for encoding in encodings:
        try:
            with open(file_path, "r", encoding=encoding) as f:
                content = f.read()

            if encoding not in ("utf-8", "utf-8-sig"):
                replacements = {
                    "\x92": "'",
                    "\x91": "'",
                    "\x93": '"',
                    "\x94": '"',
                    "\x96": "-",
                    "\x97": "-",
                    "\x85": "...",
                }
                for old, new in replacements.items():
                    content = content.replace(old, new)
            return content

        except (UnicodeDecodeError, LookupError):
            continue

    with open(file_path, "rb") as f:
        return f.read().decode("utf-8", errors="replace")


def write_json(file_path: Path, data: dict | list, indent: int = 2) -> None:
    """Write data to JSON file with UTF-8 encoding."""
    file_path.parent.mkdir(parents=True, exist_ok=True)
    file_path.write_text(
        json.dumps(data, indent=indent, ensure_ascii=False), 
        encoding="utf-8"
    )


def load_json(file_path: Path) -> dict | list:
    """Load JSON file with safe encoding."""
    content = read_file_safe(file_path)
    return json.loads(content)
