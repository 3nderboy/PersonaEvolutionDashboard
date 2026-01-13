import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const [sampleMode, setSampleMode] = useState(true);

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed inset-y-0 pb-10">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-sky-500/20">
          <span className="text-white font-bold text-lg">O</span>
        </div>
        <span className="text-white font-bold text-lg tracking-tight">OPeRA</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-8 space-y-2">
        <NavLink to="/" className={({ isActive }) => `flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
          <span className="text-xl mr-3">📊</span>
          <span className="font-medium">Overview</span>
        </NavLink>

        <NavLink to="/users" className={({ isActive }) => `flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
          <span className="text-xl mr-3">👥</span>
          <span className="font-medium">Users</span>
        </NavLink>

        <NavLink to="/sessions" className={({ isActive }) => `flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
          <span className="text-xl mr-3">⏱️</span>
          <span className="font-medium">Sessions</span>
        </NavLink>
      </nav>

      {/* Mode Toggle */}
      <div className="px-6 mt-auto">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center justify-between mb-3 text-sm">
            <span className="text-slate-400">Data Mode</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">
              {sampleMode ? 'Sample' : 'Full'}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 leading-tight">
            Using curated sample set (25 users) for GitHub Pages compatibility.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;