# Data-Driven Persona Evolution Dashboard (IP5)

**From Static Artifacts to Living Models**  
A dashboard for visualizing and analyzing how user behavior and personas change over time.


## Project Vision

Organizations increasingly rely on user data, yet many still work with **static personas** created early in a project and rarely updated. As user groups evolve, these personas lose validity.

This project builds a **flexible, data-driven approach** that identifies how user behavior, and therefore personas, change over time. We aim to demonstrate that personas should be **dynamic, evolving representations**.

### Key Capabilities

- **Temporal Clustering** – Segmentation of users across discrete time windows to identify behavioral pattern shifts  
- **Drift Detection** – Classification of persona states as Stable, Drifting, or Splitting based on longitudinal analysis  
- **Interactive Visualization** – Provides Requirements Engineers with tools to explore and analyze user evolution


## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- [Ollama](https://ollama.ai/) (optional, for LLM extraction)

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

### 2. Run the Data Pipeline

```bash
cd backend/scripts

# Core pipeline: Download + Cluster (no LLM, fast)
python run_pipeline.py

# Full pipeline: Core + LLM extraction
python run_pipeline.py --all

# LLM only: If data already exists
python run_pipeline.py --llm
```

**Individual Scripts:**

| Script | Description | Output |
|--------|-------------|--------|
| `download_hf_dataset.py` | Downloads OPeRA dataset from HuggingFace | `backend/data/NEU-HAI__OPeRA/` |
| `persona_clustering.py` | Clusters users by behavioral metrics using K-Means | `personas.json`, `sessions.json`, `metadata.json`, `monthly_clusters.json` |
| `extract_users.py` | Extracts user profiles from interview transcripts via LLM | `users/{id}.json` |
| `combine_users.py` | Merges individual profiles into a single file | `users/llm_users.json` |
| `extract_personas.py` | Generates cluster-level personas via LLM | `cluster_personas/*.json` |

### 3. LLM Provider Options

| Provider | Setup |
|----------|-------|
| **Ollama** (default) | `ollama pull gemma3` |
| **OpenAI** | Set `OPENAI_API_KEY` in `backend/.env` |

### 4. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)**.


## Architecture

```
/PersonaEvolutionDashboard
│
├── /backend                    # Python data processing
│   ├── /data                   # Downloaded datasets
│   │   └── /NEU-HAI__OPeRA     # OPeRA dataset files
│   └── /scripts                # Processing scripts
│       ├── config.py           # Central configuration
│       ├── run_pipeline.py     # Pipeline orchestrator
│       ├── /models             # Pydantic validation models
│       ├── /prompts            # LLM prompt templates
│       └── /utils              # Shared utilities
│
├── /frontend                   # React dashboard (Vite)
│   ├── /public/data            # Generated JSON output
│   │   ├── /personas           # Clustering + cluster personas
│   │   └── /users              # LLM-extracted profiles
│   └── /src
│       ├── /components         # UI Components
│       └── /services           # Data fetching
│
└── /docs                       # Documentation
```


## Features

### Dashboard Features

- **Cluster Map** – 2D visualization of user clusters (Activity vs. Complexity)  
- **Cluster Summary** – Overview of clusters with user counts and metrics  
- **Persona Evolution Timeline** – Lifecycle view showing persona emergence and changes  
- **Drift Analysis** – Visual indicators explaining how groups have changed  
- **Comparative Analysis** – Side-by-side timeframe comparison  
- **Dynamic Persona Naming** – Behavior-based labels (e.g., "Search-Driven Explorer")




## Technologies used

| Layer | Stack |
|-------|-------|
| **Frontend** | React, Vite, Tailwind CSS, Lucide Icons |
| **Backend** | Python, Pandas, Scikit-learn, NumPy |
| **LLM** | Ollama (Gemma 3)|


## Dataset

Uses the **OPeRA dataset** from [NEU-HAI on HuggingFace](https://huggingface.co/datasets/NEU-HAI/OPeRA).


## Authors
IP5 Team - FHNW
