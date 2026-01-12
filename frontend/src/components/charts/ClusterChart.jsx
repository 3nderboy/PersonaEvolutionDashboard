import React from 'react';

import { CLUSTER_COORDS, SIMULATED_DATA_POINTS } from "../../data/mockData.js";

// ClusterChart (Simulated 2D Visualization)
const ClusterChart = ({ clusters, timeWindow }) => {
  const dataPoints = SIMULATED_DATA_POINTS[timeWindow] || [];

  return (
    <div className="relative flex-1 bg-slate-950/40 rounded-xl border border-dashed border-sky-800/50 p-4 text-xs text-slate-400">
      <div className="absolute top-1 right-3 text-[10px] text-slate-500 border border-dashed border-slate-700 px-2 py-1 rounded-full">
            Visualization of User Data Points and Cluster Centers
      </div>

      {/* Axis Labels: */}
      <div className="absolute top-1/2 -left-1 transform -translate-x-full -rotate-90 text-sm font-semibold text-slate-500">Feature 2 (e.g., Complexity)</div>
      <div className="absolute left-1/2 -bottom-1 transform -translate-y-full -translate-x-1/2 text-sm font-semibold text-slate-500">Feature 1 (e.g., Activity)</div>

      {/* Grid: */}
      <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-10 pointer-events-none">
        {Array.from({ length: 16 }).map((_, i) => (
          <div key={i} className="border border-slate-700/50"></div>
        ))}
      </div>

      {/* 1. Individual User Data Points: */}
      {dataPoints.map((point) => {
        const coords = CLUSTER_COORDS[point.clusterId];
        // point.x and point.y are already calculated for the CSS coordinate system (0% top, 0% left)
        if (!coords) return null; 

        return (
            <div
                key={point.id}
                className={`absolute w-1 h-1 rounded-full opacity-60 transition duration-100 ease-out`}
                style={{ left: point.x, top: point.y, backgroundColor: coords.color.replace('bg-', '#').replace('/50', '')}}
                title={`User in Cluster ${point.clusterId}`}
            ></div>
        );
      })}


      {/* 2. Cluster Centers (Overlaid for visibility): */}
      {clusters.map((cluster) => {
        const coords = CLUSTER_COORDS[cluster.id];
        
        if (!coords) return null; // Ensure coordinates exist

        return (
          <div
            key={cluster.id}
            className="absolute flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: coords.x, top: `calc(100% - ${coords.y})` }} // Y-axis is inverse (0% bottom)
          >
            {/* The large circle segment (center): */}
            <div
              className={`w-6 h-6 rounded-full ${coords.color.replace('/50', '')} shadow-2xl transition duration-300 ring-4 ring-offset-2 ring-offset-slate-900/50 opacity-90`}
              title={`${cluster.label} (${cluster.id}) Center`}
            />
            {/* The Cluster Label: */}
            <span
              className={`absolute px-2 py-1 rounded-lg text-xs font-bold whitespace-nowrap z-10 
              ${coords.color.replace('bg-', 'bg-')}/90 text-slate-900 shadow-md 
              ${coords.labelPos === 'top-left' ? 'bottom-full right-full -mr-2 -mb-2' : ''}
              ${coords.labelPos === 'top-right' ? 'bottom-full left-full -ml-2 -mb-2' : ''}
              ${coords.labelPos === 'bottom-left' ? 'top-full right-full -mr-2 -mt-2' : ''}
              ${coords.labelPos === 'bottom-right' ? 'top-full left-full -ml-2 -mt-2' : ''}
              `}
            >
                {cluster.id} ({cluster.size})
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default ClusterChart;