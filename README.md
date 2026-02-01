# Data-Driven Persona Evolution Dashboard (IP5)

**From Static Artifacts to Living Models**  
A dashboard for visualizing and analyzing how user behavior and personas change over time.


## Project Vision

Organizations increasingly rely on user data, yet many still work with **static personas** created early in a project and rarely updated. As user groups evolve, these personas lose validity.

Our vision is to change this. This project builds a **flexible, data-driven approach** that identifies how user behavior, and therefore personas, change over time. We aim to demonstrate that personas should be **dynamic, evolving representations**.

### Key Capabilities

- **Temporal Clustering**  
  Grouping users across multiple time windows (for example in our Demo Dashboard with the timestamps January vs. July) to spot natural behavior shifts.

- **Drift Detection**  
  Identifying whether a persona is:
  - **Stable**
  - **Drifting** (behavior shift)
  - **Splitting** (breaking into new subgroups)

- **Interactive Visualization**  
  Empowering Requirements Engineers to explore user evolution through a visual dashboard.


## Architecture

The project follows a modern **Client–Server architecture** to separate data-heavy processing from interactive visualization.

```text
/PersonaEvolutionDashboard
│
├── /.github                 # Deployment for GitHub-Pages (future GitLab-Page)
│   ├── /workflows           
│   │   ├── deploy.yml       
│
├── /backend                 # Python data processing
│   ├── /data                # Downloaded datasets (CSV)
│   │   └── /NEU-HAI__OPeRA  # OPeRA dataset files
│   ├── /scripts             # Data processing scripts
│   │   ├── config.py        # Central configuration (paths, LLM settings)
│   │   ├── run_pipeline.py  # Pipeline orchestrator (run all scripts)
│   │   ├── download_hf_dataset.py
│   │   ├── persona_clustering.py
│   │   ├── extract_users.py
│   │   ├── extract_personas.py
│   │   ├── combine_users.py
│   │   ├── /prompts         # LLM prompt templates
│   │   ├── /utils           # Shared utilities (LLM client, file helpers, logger)
│   │   └── /models          # Pydantic models for LLM response validation
│   └── requirements.txt     # Python dependencies
│
├── /frontend                # React dashboard (Vite)
│   ├── /public              
│   │   └── /data            # Generated JSON data (output from backend)
│   │       ├── /personas    # Clustering output
│   │       └── /users       # LLM-extracted user profiles
│   ├── /src
│   │   ├── /components      # UI Components
│   │   ├── /services        # Data fetching
│   │   └── /style           # CSS
│   └── package.json
│
├── /docs                    # Documentation
└── README.md
```


## Features

### Features of the Demo Dashboard:  
**Cluster Map (Feature Space)**: A 2D visualization of user clusters based on behavioral metrics (for example Activity vs. Complexity). Supports switching between different clustering algorithms (K-Means, DBSCAN).

**Cluster Summary**: A list of the different clusters with information about them (number of users, average number of sessions and a specific indicator for the data available).

**Persona Evolution Timeline**: A linear view showing the lifecycle of specific personas. Clearly indicates if a persona existed in previous time windows or if it is a newly emerged group.

**Drift Analysis (Persona Details)**: Visual indicators and descriptions explaining how a group has changed (for example "Older Confident Users" evolving from "Struggling Users" after a UI update).

**Comparative Analysis**: Side-by-side comparison of different timeframes/timestamps (for example Initial Launch vs. Post-Update).

**Dynamic Persona Naming**: Instead of static labels, personas are named dynamically based on their dominant behaviors (e.g., "Search-Driven Explorer" vs. "Decisive Filter-User") using a semantic feature descriptor engine.

**Confidence & Evidence UI**: Every generated attribute (e.g., "High Price Preference") is displayed with a confidence score and a "hover-for-evidence" tooltip, showing the exact data signal that led to the conclusion. This prevents "blind trust" in the AI.

### Possible upcoming features:  
**Cluster Centroids**: Instead of the Cluster Map, a radar chart which shows the different clusters and their behavior could make more sense. We would have more axes and therefore it would be easier to understand, how a cluster or a specific user behaves. This would also need a so-called **Axes Breakdown**, an explanation for the different axes of the radar chart.

**Single User View**: It would be nice to have an option to see the behavior and the data of a single user. This often makes sense to just check something or to bring up some examples.

**Detail View**: If the dataset is detailed enough, it would be helpful to see details about the changes/drift of the different axes (score for each axis compared to the timestamp before). For single users it could also contain the basic information of the user (like user-id, current cluster, age, nationality, money spent, etc.). 


## Getting Started

## Quick Start Guide

Follow these steps to get the project running from scratch.

### 1. Backend Setup (Data Pipeline)
The backend processes the OPeRA dataset and generates the JSON files required by the frontend.

```bash
cd backend

# Install Python dependencies
pip install -r requirements.txt
```

#### Option A: Single Command (Recommended)

Run the entire core pipeline with one command:

```bash
# Core pipeline: Download data + Generate personas (fast, no LLM)
python scripts/run_pipeline.py

# Full pipeline: Core + LLM extraction (requires Ollama or OpenAI)
python scripts/run_pipeline.py --all

# LLM only: Run extraction steps if data already exists
python scripts/run_pipeline.py --llm
```

#### Option B: Step by Step

Run each script individually:

```bash
# 1. Download OPeRA Dataset → backend/data/NEU-HAI__OPeRA/
python scripts/download_hf_dataset.py

# 2. Generate Personas → frontend/public/data/personas/
#    Output: personas.json, sessions.json, metadata.json, monthly_clusters.json
python scripts/persona_clustering.py
```

### 2. LLM Extraction (Optional)

Enrich personas with LLM-extracted user profiles from interview transcripts.

| Script | Description | Output |
|--------|-------------|--------|
| `extract_users.py` | Extract user profiles from transcripts | `users/{user_id}.json` |
| `combine_users.py` | Merge all profiles into single file | `users/llm_users.json` |
| `extract_personas.py` | Generate cluster-level personas | `personas/cluster_personas/*.json` |

#### LLM Provider Options

| Provider | Setup | Cost |
|----------|-------|------|
| **Ollama (Local)** | Install [Ollama](https://ollama.ai/), run `ollama pull gemma3` | Free |
| **OpenAI** | Set `OPENAI_API_KEY` in `backend/.env` | ~$0.01/user |

```bash
cd backend/scripts

# 1. Extract user profiles from transcripts → /users/{user_id}.json
python extract_users.py

# 2. Combine user profiles → /users/llm_users.json
python combine_users.py

# 3. Generate cluster personas → /personas/cluster_personas/*.json
python extract_personas.py
```

Use `--provider openai` for OpenAI instead of Ollama.

### 3. Frontend Setup (Dashboard)
The frontend visualizes the generated data.

```bash
cd frontend

# 1. Install Node.js dependencies
npm install

# 2. Start the Development Server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.


## Dataset Fields Reference

The scripts use specific fields from the OPeRA dataset:

| Field | Source CSV | Used By | Purpose |
|-------|-----------|---------|---------|
| `session_id` | filtered_session | `persona_clustering.py` | Unique session identifier, contains timestamps |
| `user_id` | filtered_session, filtered_user | All scripts | Links sessions to users |
| `action_type` | filtered_action | `persona_clustering.py` | Behavioral metric: click, input, terminate |
| `click_type` | filtered_action | `persona_clustering.py` | Shopping intent: purchase, search, filter, review |
| `interview_transcript` | filtered_user | `extract_users.py` | LLM input for user profile extraction |

### Generated Output Files

| File | Script | Content |
|------|--------|---------|
| `personas.json` | `persona_clustering.py` | Cluster definitions with behavioral metrics |
| `sessions.json` | `persona_clustering.py` | Individual session data with PCA coordinates |
| `metadata.json` | `persona_clustering.py` | Pipeline metadata and PCA bounds |
| `monthly_clusters.json` | `persona_clustering.py` | Cluster positions aggregated by month |
| `users/{id}.json` | `extract_users.py` | LLM-extracted user profiles |
| `cluster_personas/*.json` | `extract_personas.py` | LLM-generated cluster persona narratives |


## Technologies

Frontend: React, Vite, Tailwind CSS, Lucide React (Icons).
Backend: Python, probably FastAPI in the future.
Data Science: Pandas, Scikit-learn, NumPy.


## Used Dataset

The dashboard uses the **OPeRA dataset** from [NEU-HAI on HuggingFace](https://huggingface.co/datasets/NEU-HAI/OPeRA).

## Authors
IP5 Team - FHNW
