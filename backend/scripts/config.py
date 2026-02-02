"""
Central Configuration for all Backend Scripts.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# BASE PATHS
SCRIPT_DIR = Path(__file__).parent
BACKEND_DIR = SCRIPT_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"

# DATA SOURCE PATHS (OPeRA Dataset)
OPERA_DATA_DIR = BACKEND_DIR / "data" / "NEU-HAI__OPeRA"

# Raw data CSVs (used by persona_clustering.py)
SESSION_CSV = OPERA_DATA_DIR / "filtered_session" / "train.csv"
ACTION_CSV = OPERA_DATA_DIR / "filtered_action" / "train.csv"
USER_CSV = OPERA_DATA_DIR / "filtered_user" / "train.csv"

# Legacy alias for extract_users.py (uses filtered_user directory)
DATA_DIR = OPERA_DATA_DIR / "filtered_user"

# OUTPUT PATHS
# User profiles (LLM extracted)
USERS_DIR = FRONTEND_DIR / "public" / "data" / "users"

# Persona data (clustering output)
PERSONAS_DIR = FRONTEND_DIR / "public" / "data" / "personas"
SESSIONS_FILE = PERSONAS_DIR / "sessions.json"
PERSONAS_FILE = PERSONAS_DIR / "personas.json"
CLUSTER_PERSONAS_DIR = PERSONAS_DIR / "cluster_personas"

# CLUSTERING CONFIGURATION
CLUSTER_CONFIG = {
    # Number of personas to generate (fixed at 5 per NN/g recommendation)
    # Higher values fragment the audience, lower values lose nuance
    "min_clusters": 5,
    "max_clusters": 5,
    # Fixed seed for reproducibility - same input always yields same clusters
    "random_state": 42,
}

# LLM CONFIGURATION
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma3")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

# PROMPT PATHS
PROMPTS_DIR = SCRIPT_DIR / "prompts"
USER_PROFILE_PROMPT = PROMPTS_DIR / "user_profile.txt"
CLUSTER_PERSONA_PROMPT = PROMPTS_DIR / "cluster_persona.txt"
