import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar.jsx';
import DashboardLayout from './components/layout/DashboardLayout.jsx';
import OverviewView from './components/views/OverviewView.jsx';
import PersonaClusterView from './components/views/PersonaClusterView.jsx';

// Main App Component
const App = () => {
    return (
        <BrowserRouter>
            <div className="min-h-screen bg-slate-950 text-slate-200 flex">
                <Sidebar />
                <DashboardLayout>
                    <Routes>
                        <Route path="/" element={<OverviewView />} />
                        <Route path="/personas" element={<PersonaClusterView />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </DashboardLayout>
            </div>
        </BrowserRouter>
    );
};

export default App;
