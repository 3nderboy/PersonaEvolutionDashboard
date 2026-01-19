import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  return (
    <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed inset-y-0 pb-10">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-sky-500/20">
          <span className="text-white font-bold text-lg">P</span>
        </div>
        <span className="text-white font-bold text-lg tracking-tight">Persona Evolution</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-8 space-y-2">
        <NavLink to="/" className={({ isActive }) => `flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
          <span className="text-xl mr-3">📊</span>
          <span className="font-medium">Overview</span>
        </NavLink>

        <NavLink to="/personas" className={({ isActive }) => `flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${isActive ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
          <span className="text-xl mr-3">🎭</span>
          <span className="font-medium">Personas</span>
        </NavLink>
      </nav>

      {/* Info */}
      <div className="px-6 mt-auto">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-2">Data Source</div>
          <div className="text-sm text-white font-medium">OPeRA Dataset</div>
          <div className="text-[10px] text-slate-500 mt-2 leading-tight">
            437 sessions • 5 personas • 3 months
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;