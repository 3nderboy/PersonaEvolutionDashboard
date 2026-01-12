/PersonaEvolutionDashboard
│
├── /.github                 # Deployment for GitHub-Pages
│   ├── /workflows           
│   │   ├── deploy.yml       
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