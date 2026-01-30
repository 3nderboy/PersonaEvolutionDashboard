"""
Central Configuration for all Backend Scripts.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# --- Base Paths ---
SCRIPT_DIR = Path(__file__).parent
BACKEND_DIR = SCRIPT_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"

# --- Data Paths ---
DATA_DIR = BACKEND_DIR / "data" / "NEU-HAI__OPeRA" / "filtered_user"
USERS_DIR = FRONTEND_DIR / "public" / "data" / "users"
PERSONAS_DIR = FRONTEND_DIR / "public" / "data" / "personas"
SESSIONS_FILE = PERSONAS_DIR / "sessions.json"
PERSONAS_FILE = PERSONAS_DIR / "personas.json"
CLUSTER_PERSONAS_DIR = PERSONAS_DIR / "cluster_personas"

# --- LLM Configuration ---
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma3")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# --- Prompt Paths ---
PROMPTS_DIR = SCRIPT_DIR / "prompts"
USER_PROFILE_PROMPT = PROMPTS_DIR / "user_profile.txt"
CLUSTER_PERSONA_PROMPT = PROMPTS_DIR / "cluster_persona.txt"
