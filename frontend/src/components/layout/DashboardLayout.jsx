import React from 'react';

// Dashboard Layout Component
const DashboardLayout = ({ children }) => {
  return (
    <main className="flex-1 flex flex-col">
      <header className="h-12 border-b border-slate-800 flex items-center px-6 text-sm text-slate-300 bg-slate-900/50">
        <span className="font-semibold text-sky-300">Analysis Dashboard</span>
        <span className="mx-2 text-slate-600">/</span>
        <span className="text-slate-500">
          Clusters and persona evolution over time
        </span>
      </header>
      {/* Main area with responsive grid: */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 overflow-auto">
        {children}
      </div>
      <footer className="h-10 border-t border-slate-800 flex items-center px-6 text-xs text-slate-600 bg-slate-900/50">
        Demo Dashboard - Not finished
      </footer>
    </main>
  );
};

export default DashboardLayout;