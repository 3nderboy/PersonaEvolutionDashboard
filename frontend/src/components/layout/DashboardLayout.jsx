import React from 'react';

// Dashboard Layout Component
const DashboardLayout = ({ children }) => {
  return (
    <main className="flex-1 flex flex-col ml-64 min-h-screen bg-slate-950">
      <header className="h-12 border-b border-slate-800 flex items-center px-6 text-sm text-slate-300 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-30">
        <span className="font-semibold text-sky-300">Analysis Dashboard</span>
        <span className="mx-2 text-slate-600">/</span>
        <span className="text-slate-500">
          Clusters and persona evolution over time
        </span>
      </header>
      {/* Main area - Flex container, letting children manage their own layout/width */}
      <div className="flex-1 p-6 overflow-x-hidden">
        {children}
      </div>
      <footer className="h-10 border-t border-slate-800 flex items-center px-6 text-xs text-slate-600 bg-slate-900/50">
        Demo Dashboard - Not finished
      </footer>
    </main>
  );
};

export default DashboardLayout;