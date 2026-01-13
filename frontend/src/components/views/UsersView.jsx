import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { loadData } from '../../utils/dataLoader';
import PersonaRadarChart from '../charts/PersonaRadarChart';
import UserDetailModal from './UserDetailModal';
import { getPersonaColor } from '../../utils/colors';

const UsersView = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null); // For Modal
    const [hoveredUser, setHoveredUser] = useState(null);   // For Sticky Radar
    const [searchParams, setSearchParams] = useSearchParams();

    // Archetype definitions for comparison/reference
    const archetypesData = {
        "Decisive Shopper": { decisiveness: 0.9, exploration: 0.3, research_depth: 0.4, price_sensitivity: 0.2, engagement: 0.6 },
        "Explorer": { decisiveness: 0.3, exploration: 0.9, research_depth: 0.5, price_sensitivity: 0.4, engagement: 0.7 },
        "Researcher": { decisiveness: 0.4, exploration: 0.6, research_depth: 0.9, price_sensitivity: 0.5, engagement: 0.8 },
        "Budget Conscious": { decisiveness: 0.5, exploration: 0.4, research_depth: 0.6, price_sensitivity: 0.9, engagement: 0.6 },
        "Methodical": { decisiveness: 0.5, exploration: 0.5, research_depth: 0.5, price_sensitivity: 0.5, engagement: 0.5 }
    };

    useEffect(() => {
        const load = async () => {
            try {
                const data = await loadData('users.json');
                setUsers(data);

                // Check URL for initial modal open
                const openId = searchParams.get('open');
                if (openId) {
                    const target = data.find(u => u.user_id === openId);
                    if (target) setSelectedUser(target);
                }

                // Default hover to first user
                if (data.length > 0) setHoveredUser(data[0]);

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [searchParams]);

    // Close selection on key press
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') setSelectedUser(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const activeUser = hoveredUser || users[0];
    const activeColor = activeUser ? getPersonaColor(activeUser.persona_type) : { hex: '#0ea5e9', border: 'border-sky-500', text: 'text-sky-400', bg: 'bg-sky-500' };

    // Prepare data for the multi-radar comparison (if needed) or individual
    // Currently we just show the hovered user.

    return (
        <div className="flex gap-6 h-[calc(100vh-100px)]">
            {/* Left: Scrollable User Grid */}
            <div className="flex-1 overflow-y-auto pr-2">
                <h2 className="text-xl font-bold text-white mb-4 sticky top-0 bg-slate-950 z-10 py-2">
                    User Profiles ({users.length})
                </h2>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {users.map(user => {
                        const pColor = getPersonaColor(user.persona_type);
                        const isHovered = hoveredUser?.user_id === user.user_id;

                        return (
                            <div
                                key={user.user_id}
                                className={`user-card p-4 rounded-xl border transition cursor-pointer group relative
                                    ${isHovered
                                        ? `bg-slate-800 ${pColor.border} shadow-lg`
                                        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800'
                                    }`}
                                style={isHovered ? { borderColor: pColor.hex, boxShadow: `0 0 20px -5px ${pColor.hex}33` } : {}}
                                onMouseEnter={() => setHoveredUser(user)}
                                onClick={() => setSelectedUser(user)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className={`text-sm font-mono mb-1 ${isHovered ? pColor.text : 'text-slate-400'}`}>
                                            {user.user_id.slice(0, 8)}...
                                        </div>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${pColor.soft}`}>
                                            {user.persona_type}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-slate-400">Actions</div>
                                        <div className="text-lg font-bold text-white">{user.total_actions}</div>
                                    </div>
                                </div>

                                {/* Mini Impact Summary */}
                                <div className="space-y-1 mt-3 pt-3 border-t border-slate-700/50">
                                    {Object.entries(user.impact_factors || {}).slice(0, 2).map(([key, factors]) => (
                                        factors.length > 0 && (
                                            <div key={key} className="text-[10px] text-slate-400 flex items-center gap-1">
                                                <span className={`w-1 h-1 rounded-full ${pColor.bg}`}></span>
                                                {factors[0]}
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right: Sticky Radar Panel */}
            <div className="sticky-sidebar w-[400px] hidden lg:block">
                <div className={`bg-slate-800/80 backdrop-blur rounded-2xl border p-6 sticky top-0 h-full flex flex-col transition-colors duration-300 ${activeUser ? activeColor.border : 'border-slate-700'} border-opacity-30`}>

                    {/* Header */}
                    <div className="mb-6">
                        <div className="text-xs text-slate-400 mb-1 uppercase tracking-wider">
                            {hoveredUser ? 'Selected Profile' : 'Archetype Reference'}
                        </div>
                        <div className="text-2xl font-bold text-white font-mono break-all leading-tight">
                            {hoveredUser ? hoveredUser.user_id.slice(0, 12) + '...' : 'Persona Archetypes'}
                        </div>
                        {hoveredUser && (
                            <div className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-bold border border-opacity-30 ${activeColor.soft} ${activeColor.border}`}>
                                {hoveredUser.persona_type}
                            </div>
                        )}
                    </div>

                    {/* Chart Area */}
                    <div className="flex-1 min-h-0 flex items-center justify-center -ml-6 relative">
                        {hoveredUser ? (
                            <PersonaRadarChart
                                data={[hoveredUser]}
                                color={activeColor.hex}
                                width={350}
                                height={350}
                                className="w-full h-full"
                            />
                        ) : (
                            // Archetypes Comparison (Fallback if no hover, but we default hover)
                            <div className="text-center text-slate-500">
                                Hover over users to see details
                            </div>
                        )}
                    </div>

                    {/* Stats / CTA */}
                    {hoveredUser && (
                        <div className="mt-6 space-y-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Total Sessions</span>
                                <span className="text-white font-bold">{hoveredUser.sessions_count || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Avg Actions/Session</span>
                                <span className="text-white font-bold">
                                    {Math.round((hoveredUser.total_actions || 0) / Math.max(1, hoveredUser.sessions_count || 1))}
                                </span>
                            </div>
                            <button
                                className={`w-full mt-4 py-2 text-white rounded-lg font-bold transition shadow-lg ${activeColor.bg} hover:opacity-90`}
                                style={{ boxShadow: `0 4px 14px 0 ${activeColor.hex}66` }}
                                onClick={() => setSelectedUser(hoveredUser)}
                            >
                                View Deep Dive Analysis
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {selectedUser && (
                <UserDetailModal
                    user={selectedUser}
                    onClose={() => {
                        setSelectedUser(null);
                        setSearchParams({});
                    }}
                />
            )}
        </div>
    );
};

export default UsersView;
