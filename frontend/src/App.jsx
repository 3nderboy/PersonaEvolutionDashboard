import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar.jsx';
import DashboardLayout from './components/layout/DashboardLayout.jsx';
import OverviewView from './components/views/OverviewView.jsx';
import UsersView from './components/views/UsersView.jsx';
import SessionsView from './components/views/SessionsView.jsx';
import SessionDetailView from './components/views/SessionDetailView.jsx';

// Main App Component
const App = () => {
    // Legacy state for existing cluster visualization (kept for backward compatibility)
    const [timeWindow, setTimeWindow] = useState("2025-01");
    const [method, setMethod] = useState("kmeans");

    return (
        <BrowserRouter>
            <div className="min-h-screen bg-slate-950 text-slate-200 flex">
                <Sidebar
                    timeWindow={timeWindow}
                    setTimeWindow={setTimeWindow}
                    method={method}
                    setMethod={setMethod}
                />
                <DashboardLayout>
                    <Routes>
                        <Route path="/" element={<OverviewView />} />
                        <Route path="/users" element={<UsersView />} />
                        <Route path="/sessions" element={<SessionsView />} />
                        <Route path="/session/:sessionId" element={<SessionDetailView />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </DashboardLayout>
            </div>
        </BrowserRouter>
    );
};

export default App;
