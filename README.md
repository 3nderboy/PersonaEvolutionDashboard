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
├── /.github                 # Deployment for GitHub-Pages
│   ├── /workflows           
│   │   ├── deploy.yml       
│
├── /backend                 # Python/ipynb-Notebook Stuff
│   ├── /data                # Downloaded datasets (json)
│   ├── /scripts             # Utility scripts
│   │   └── download_hf_dataset.py
│   ├── /analysis            # Logic from notebook
│   │   ├── clustering.py    # K-Means, DBSCAN logic
│   │   ├── preprocessing.py # Data Cleaning
│   │   └── evolution.py     # Logic for persona evolution
│   ├── main.py              # API-Server (FastAPI)
│   └── requirements.txt     # Python Libraries
│
├── /frontend                # React-Stuff (Vite)
│   ├── /public              # Web-Application Icon
│   ├── /src
│   │   ├── /assets          # Images and Fonts
│   │   ├── /components      # UI Components (Sidebar, Charts...)
│   │   │   ├── /common      # Buttons, Inputs, Icons
│   │   │   ├── /charts      # ClusterChart, RadarChart
│   │   │   ├── /dashboard   # Elements of the dashboard (ClusterOverview, PersonaPanel)
│   │   │   ├── /icons       # Icons.jsx which gets all the used icons
│   │   │   └── /layout      # Dashboard-Layout, Sidebar, Header
│   │   ├── /services        # Communication with backend (fetch/axios)
│   │   ├── /data            # Mock-Data
│   │   ├── /style           # CSS
│   │   ├── App.jsx          # Routing and Layout-Building
│   │   └── main.jsx
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── .gitignore
└── README.md
```


## Features

### Features of the Demo Dashboard:  
**Cluster Map (Feature Space)**: A 2D visualization of user clusters based on behavioral metrics (for example Activity vs. Complexity). Supports switching between different clustering algorithms (K-Means, DBSCAN).

**Cluster Summary**: A list of the different clusters with information about them (number of users, average number of sessions and a specific indicator for the data available).

**Persona Evolution Timeline**: A linear view showing the lifecycle of specific personas. Clearly indicates if a persona existed in previous time windows or if it is a newly emerged group.

**Drift Analysis (Persona Details)**: Visual indicators and descriptions explaining how a group has changed (for example "Older Confident Users" evolving from "Struggling Users" after a UI update).

**Comparative Analysis**: Side-by-side comparison of different timeframes/timestamps (for example Initial Launch vs. Post-Update).

### Possible upcoming features:  
**Cluster Centroids**: Instead of the Cluster Map, a radar chart which shows the different clusters and their behavior could make more sense. We would have more axes and therefore it would be easier to understand, how a cluster or a specific user behaves. This would also need a so-called **Axes Breakdown**, an explanation for the different axes of the radar chart.

**Single User View**: It would be nice to have an option to see the behavior and the data of a single user. This often makes sense to just check something or to bring up some examples.

**Detail View**: If the dataset is detailed enough, it would be helpful to see details about the changes/drift of the different axes (score for each axis compared to the timestamp before). For single users it could also contain the basic information of the user (like user-id, current cluster, age, nationality, money spent, etc.). 


## Getting Started

**Prerequisites:**  

- Node.js (v18+, tested with v24.11.1)
- Python (3.9+, tested with Python 3.14.0)

**Frontend Setup (React)**:

The frontend handles the visualization. Currently (11.01.2026), it runs on mock data derived from our Python analysis.

The whole frontend gets deployed automatically to GitHub-Pages when there is a push/merge to the main-branch.  

The link for the GitHub-Page is the following:  
Open [Persona Evolution Dashboard](https://3nderboy.github.io/PersonaEvolutionDashboard/) in your browser.

If you want to try it out locally, run the following commands in the terminal after forking the project:

```text
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.


**Backend Setup (Python)**:

**Dataset Download**:

Download the OPeRA dataset from HuggingFace:

Optional: Create .env with HF_TOKEN for authenticated access

```bash
# Run the download script
py backend/scripts/download_hf_dataset.py
```


## Data Analysis Workflow

The core logic of this project is validated in our Jupyter Notebooks before implementation in the backend.

1. Preprocessing: Merging implicit behavior, explicit feedback, and demographic data.

2. Clustering: Applying K-Means (for spherical, balanced clusters) and maybe further DBSCAN (for density-based outlier detection) on normalized data.

3. Evolution Mapping:
  - We compare Cluster Centers ($C_t$) at time $t$ with centers at $t+1$.
  - If a center shifts significantly but retains overlap, it is Drifting.
  - If a cluster divides into multiple distinct centers, it is Splitting.


## Technologies

Frontend: React, Vite, Tailwind CSS, Lucide React (Icons).
Backend: Python, probably FastAPI in the future.
Data Science: Pandas, Scikit-learn, NumPy.


## Used Dataset

The dashboard uses the **OPeRA dataset** from [NEU-HAI on HuggingFace](https://huggingface.co/datasets/NEU-HAI/OPeRA). The sample data generation script (`backend/scripts/generate_sample_data.py`) extracts user profiles with behavioral metrics and real interview transcripts.

To regenerate sample data:
```bash
python backend/scripts/generate_sample_data.py
```
Output is placed in `frontend/public/data/sample/`.


## Project Status & Roadmap

[x] Phase 1: Concept & Analysis (Data exploration in Python Notebooks).

[x] Phase 2: Frontend Prototype (React Dashboard with mock data architecture).

[ ] Phase 3: Backend Integration (Get/load the data in the frontend and connecting React to Python API).

[ ] Phase 4: Real-time Evolution (Processing the full dataset dynamically).


## Authors
IP5 Team - FHNW
