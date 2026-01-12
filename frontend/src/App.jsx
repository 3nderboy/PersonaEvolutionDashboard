import React, { useState } from "react";
import Sidebar from "./components/layout/Sidebar.jsx";
import DashboardLayout from "./components/layout/DashboardLayout.jsx";
import ClusterOverview from "./components/dashboard/ClusterOverview.jsx";
import PersonaPanel from "./components/dashboard/PersonaPanel.jsx";
import { CLUSTERS_BY_TIME, PERSONAS } from "./data/mockData.js";

// Main App
const App = () => {
  const [timeWindow, setTimeWindow] = useState("2025-01");
  const [method, setMethod] = useState("kmeans");
  const [selectedPersonaId, setSelectedPersonaId] = useState("A");

  // Fallback in case of missing data
  const clusters = CLUSTERS_BY_TIME[timeWindow] || [];
  const selectedPersona = PERSONAS.find((p) => p.id === selectedPersonaId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex font-sans">
      <Sidebar
        timeWindow={timeWindow}
        setTimeWindow={setTimeWindow}
        method={method}
        setMethod={setMethod}
      />
      <DashboardLayout>
        <ClusterOverview
          timeWindow={timeWindow}
          method={method}
          clusters={clusters}
        />
        <PersonaPanel
          personas={PERSONAS}
          selectedPersona={selectedPersona}
          onSelectPersona={setSelectedPersonaId}
        />
      </DashboardLayout>
    </div>
  );
};

export default App;