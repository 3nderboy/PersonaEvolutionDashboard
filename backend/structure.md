/PersonaEvolutionDashboard
│
├── /backend                 # Python/ipynb-Notebook Stuff
│   ├── /data                # Raw data (csv, json)
│   ├── /analysis            # Logic from notebook
│   │   ├── clustering.py    # K-Means, DBSCAN logic
│   │   ├── preprocessing.py # Data Cleaning
│   │   └── evolution.py     # Logic for persona evolution
│   ├── main.py              # API-Server (FastAPI)
│   └── requirements.txt     # Python Libraries (pandas, sklearn, fastapi...)
│
├── /frontend                # React-Stuff (Vite)
│   ├── /public
│   ├── /src
│   │   ├── /assets          # Images and Fonts
│   │   ├── /components      # UI Components (Sidebar, Charts...)
│   │   │   ├── /common      # Buttons, Inputs, Icons
│   │   │   ├── /charts      # ClusterChart, RadarChart
│   │   │   └── /layout      # Sidebar, Header
│   │   ├── /services        # Communication with backend (fetch/axios)
│   │   ├── App.jsx          # Routing and Layout-Building
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
└── README.md