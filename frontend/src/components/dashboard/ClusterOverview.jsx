import React, { useState } from "react";
import { LayersIcon } from "../icons/Icons.jsx";
import ClusterChart from "../charts/ClusterChart.jsx";
import { CLUSTER_COORDS } from "../../data/mockData.js";

// Cluster Overview Component
// ClusterMap (Simulated Map View)
const ClusterMap = ({ clusters }) => {
    // Currently, just a simple placeholder view, idea would be a map implementation
    const mapClusters = clusters.filter(c => CLUSTER_COORDS[c.id]);

    return (
        <div className="relative flex-1 bg-slate-950/40 rounded-xl border border-dashed border-sky-800/50 p-4 text-xs text-slate-400 overflow-hidden">
            <div className="absolute top-1 right-3 text-[10px] text-slate-500 border border-dashed border-slate-700 px-2 py-1 rounded-full">
                Cluster Map
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-full bg-slate-800/50 rounded-lg shadow-inner flex items-center justify-center text-slate-600 italic text-lg font-light">
                    Cluster Map
                </div>
            </div>

            {/* Simulate Cluster Markers on the "Map": */}
            {mapClusters.map((cluster) => {
                const coords = CLUSTER_COORDS[cluster.id];
                
                return (
                    <div
                        key={cluster.id}
                        className="absolute flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                        // Positioning based on feature coordinates, but interpreted as location
                        style={{ left: coords.x, top: `calc(100% - ${coords.y})` }}
                    >
                        <div
                            className={`w-4 h-4 rounded-full ${coords.color} ring-2 ring-white/70 animate-pulse`}
                            title={`Location: ${cluster.label} (${cluster.id})`}
                        />
                         <span
                            className={`absolute px-1.5 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap z-10 
                                top-full mt-1 bg-slate-900 border border-sky-400 text-sky-200 shadow-lg`}
                        >
                            {cluster.id}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};


// Internal Component for list
const ClusterList = ({ clusters }) => {
  return (
    <ul className="space-y-3 text-xs">
      {clusters.map((cluster) => (
        <li
          key={cluster.id}
          className="flex flex-col md:flex-row items-start md:items-center justify-between rounded-xl border border-slate-700 bg-slate-800/70 p-3 transition duration-150 hover:bg-slate-700/80"
        >
          <div className="flex-1">
            <div className="text-slate-100 text-sm font-semibold">
              <span className="font-mono text-sky-400 mr-2">{cluster.id}</span>
              {cluster.label}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              <span className="inline-block mr-3">
                <span className="font-medium text-slate-300">{cluster.size}</span> users
              </span>
              <span className="inline-block mr-3">
                Avg rating: <span className="font-medium text-yellow-400">{cluster.avgRating.toFixed(1)}</span>
              </span>
              <span className="inline-block">
                Avg sessions/week: <span className="font-medium text-cyan-400">{cluster.avgSessionsPerWeek}</span>
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};


// Cluster Overview (Feature Space and Cluster Map)
const ClusterOverview = ({ timeWindow, method, clusters }) => {
  const [visualizationMode, setVisualizationMode] = useState("feature-space");

  return (
    <section className="col-span-1 lg:col-span-2 flex flex-col gap-4">
      {/* Top: Scatter Plot Area */}
      <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col shadow-lg">
        
        {/* Header and Tab Bar: */}
        <div className="flex items-start justify-between mb-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-sky-300 flex items-center gap-2">
                <LayersIcon className="w-5 h-5"/> Cluster Visualization
            </h2>
            <p className="text-xs text-slate-500">
              Time Window: <span className="font-mono text-slate-300">{timeWindow}</span> ·
              Method: <span className="font-mono uppercase text-slate-300">{method}</span>
            </p>
          </div>
          
          {/* Tab Bar for Switching: */}
          <div className="flex bg-slate-800 rounded-lg p-1 text-xs font-medium">
            <button
              onClick={() => setVisualizationMode("feature-space")}
              className={`px-3 py-1 rounded-md transition-colors duration-200 ${
                visualizationMode === "feature-space"
                  ? "bg-sky-600 text-white shadow-md"
                  : "text-slate-400 hover:bg-slate-700"
              }`}
            >
              Feature Space
            </button>
            <button
              onClick={() => setVisualizationMode("map")}
              className={`px-3 py-1 rounded-md transition-colors duration-200 ${
                visualizationMode === "map"
                  ? "bg-sky-600 text-white shadow-md"
                  : "text-slate-400 hover:bg-slate-700"
              }`}
            >
              Cluster Map
            </button>
          </div>
        </div>

        {/* Visualization content based on mode: */}
        {visualizationMode === "feature-space" ? (
          <ClusterChart clusters={clusters} timeWindow={timeWindow} />
        ) : (
          <ClusterMap clusters={clusters} />
        )}
      </div>

      {/* Bottom: Cluster List */}
      <div className="h-auto lg:h-52 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 overflow-auto shadow-lg">
        <h2 className="text-lg font-bold text-sky-300 mb-3">Cluster Summary</h2>
        <ClusterList clusters={clusters} />
      </div>
    </section>
  );
};

export default ClusterOverview;