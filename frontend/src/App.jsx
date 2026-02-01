import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar.jsx';
import DashboardLayout from './components/layout/DashboardLayout.jsx';

import PersonaClusterView from './components/views/PersonaClusterView.jsx';
import DocumentationView from './components/views/DocumentationView.jsx';

// Main App Component
const App = () => {
    return (
        <BrowserRouter>
            <div className="min-h-screen bg-slate-950 text-slate-200 flex">
                <Sidebar />
                <DashboardLayout>
                    <Routes>
                        <Route path="/personas" element={<PersonaClusterView />} />
                        <Route path="/documentation" element={<DocumentationView />} />
                        <Route path="*" element={<Navigate to="/personas" replace />} />
                    </Routes>
                </DashboardLayout>
            </div>
        </BrowserRouter>
    );
};

export default App;

