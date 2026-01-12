import React from "react";
import { CalendarIcon, TargetIcon, LayersIcon } from "../icons/Icons.jsx";

// Sidebar Component
const Sidebar = ({ timeWindow, setTimeWindow, method, setMethod }) => {
  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900 p-4 flex flex-col gap-6 rounded-r-xl shadow-2xl h-screen sticky top-0">
      <div>
        <h1 className="text-xl font-extrabold tracking-tight text-sky-400">
          Persona Evolution Dashboard (DEMO)
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Demo-dashboard for cluster & persona evolution.
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Time Window: */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <CalendarIcon className="text-sky-400" /> Timestamp
          </h2>
          <div className="flex flex-col gap-3">
            {["2025-01", "2025-07"].map((tw) => (
              <button
                key={tw}
                onClick={() => setTimeWindow(tw)}
                className={`flex flex-col p-3 rounded-xl border transition duration-200 shadow-lg text-left
                  ${
                    timeWindow === tw
                      ? "border-sky-500 bg-sky-500/20 ring-4 ring-sky-500/20"
                      : "border-slate-700 hover:border-sky-500/40 bg-slate-800 hover:bg-slate-700/80"
                  }`}
              >
                <span className={`text-sm font-semibold ${timeWindow === tw ? "text-sky-100" : "text-slate-300"}`}>
                  {tw === "2025-01" ? "Initial Status (January)" : "Status After Changes (July)"}
                </span>
                <span className={`text-xs mt-1 ${timeWindow === tw ? "text-sky-300" : "text-slate-400"}`}>
                  {tw} – {tw === "2025-01" ? "Baseline" : "Evaluation"}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Clustering Method: */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
            <TargetIcon className="text-sky-400" /> Clustering Method
          </h2>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setMethod("kmeans")}
              className={`flex-1 text-sm px-3 py-2 rounded-xl border transition duration-200 shadow-md flex items-center justify-center gap-2
                ${
                  method === "kmeans"
                    ? "border-sky-500 bg-sky-500/20 text-sky-100 font-medium ring-2 ring-sky-500/20"
                    : "border-slate-700 hover:border-sky-500/40 bg-slate-800 text-slate-300 hover:bg-slate-700/80"
                }`}
            >
              <LayersIcon /> K-Means
            </button>
            <button
              onClick={() => setMethod("dbscan")}
              className={`flex-1 text-sm px-3 py-2 rounded-xl border transition duration-200 shadow-md flex items-center justify-center gap-2
                ${
                  method === "dbscan"
                    ? "border-sky-500 bg-sky-500/20 text-sky-100 font-medium ring-2 ring-sky-500/20"
                    : "border-slate-700 hover:border-sky-500/40 bg-slate-800 text-slate-300 hover:bg-slate-700/80"
                }`}
            >
              <TargetIcon /> DBSCAN
            </button>
          </div>
        </div>
      </div>

      <div className="mt-auto text-[10px] text-slate-500 pt-4 border-t border-slate-800">
        IP5 – Data-Driven Persona Development
      </div>
    </aside>
  );
};

export default Sidebar;