import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { loadData } from '../../utils/dataLoader';
import { getPersonaColor } from '../../utils/colors';

// Histogram Component for Metric Distributions
const MetricHistogram = ({ users, metricKey, color, label }) => {
    const navigate = useNavigate();
    // 1. Create buckets (0.0-0.2, 0.2-0.4, etc.)
    const buckets = [0, 0, 0, 0, 0];
    const bucketUsers = [[], [], [], [], []]; // Store users in each bucket for interactivity

    let maxVal = 0;

    users.forEach(u => {
        const val = u.behavioral_metrics?.[metricKey] || 0;
        const bucketIdx = Math.min(Math.floor(val * 5), 4);
        buckets[bucketIdx]++;
        bucketUsers[bucketIdx].push(u);
    });

    maxVal = Math.max(...buckets, 1); // Avoid div by zero

    // Find top user for this metric (highest value)
    const topUser = [...users].sort((a, b) => (b.behavioral_metrics?.[metricKey] || 0) - (a.behavioral_metrics?.[metricKey] || 0))[0];

    return (
        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 flex flex-col h-full hover:border-slate-600 transition group">
            <div className="flex justify-between items-start mb-4">
                <h3 className={`text-sm font-bold capitalize ${color.text} flex items-center gap-2`}>
                    <span className={`w-2 h-2 rounded-full ${color.bg}`}></span>
                    {label}
                </h3>
                {topUser && (
                    <button
                        onClick={() => navigate(`/users?open=${topUser.user_id}`)}
                        className="text-[10px] text-slate-500 hover:text-white transition flex items-center gap-1"
                        title={`View Top ${label}: ${topUser.user_id}`}
                    >
                        Top: {topUser.user_id.slice(0, 4)}... ↗
                    </button>
                )}
            </div>

            {/* Histogram Bars */}
            <div className="flex-1 flex items-end gap-1 h-24 mb-2">
                {buckets.map((count, i) => {
                    const heightPct = (count / maxVal) * 100;
                    // Ensure bar is visible even if value is small but non-zero? 
                    // Actually, if count is 0, height is 0. That's correct.
                    // But user said "A value is assigned but no bars are visible".
                    // Maybe height calculation is failing or CSS issue.
                    // I will add a min-height for non-zero values.
                    const displayHeight = count > 0 ? Math.max(heightPct, 5) : 0;

                    return (
                        <div key={i} className="flex-1 flex flex-col justify-end group/bar relative h-full">
                            {/* Comparison Tooltip on Hover */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-slate-900 text-xs px-2 py-1 rounded border border-slate-700 opacity-0 group-hover/bar:opacity-100 whitespace-nowrap z-20 pointer-events-none">
                                {count} users
                            </div>

                            <div
                                className={`w-full rounded-t-sm transition-all duration-500 ${color.bg}`}
                                style={{
                                    height: `${displayHeight}%`,
                                    opacity: 0.4 + (i * 0.15) // Gradient effect opacity
                                }}
                            ></div>
                        </div>
                    );
                })}
            </div>

            {/* X-Axis Labels */}
            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>Low</span>
                <span>Avg</span>
                <span>High</span>
            </div>

            {/* Stat Summary */}
            <div className="mt-3 pt-3 border-t border-slate-700/30 flex justify-between items-center">
                <span className="text-xs text-slate-400">Avg Score</span>
                <span className={`text-sm font-bold ${color.text}`}>
                    {(users.reduce((acc, u) => acc + (u.behavioral_metrics?.[metricKey] || 0), 0) / Math.max(1, users.length)).toFixed(2)}
                </span>
            </div>
        </div>
    );
};

const OverviewView = () => {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hoveredPersona, setHoveredPersona] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                // Load global stats
                const kpis = await loadData('global_kpis.json');
                const userList = await loadData('users.json');
                setStats(kpis);
                setUsers(userList);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <div className="text-center py-20 text-slate-500">Loading dashboard...</div>;

    const cards = [
        { label: "Decisiveness", key: "decisiveness", color: getPersonaColor("Decisive Shopper") },
        { label: "Exploration", key: "exploration", color: getPersonaColor("Explorer") },
        { label: "Research Depth", key: "research_depth", color: getPersonaColor("Researcher") },
        { label: "Price Sensitivity", key: "price_sensitivity", color: getPersonaColor("Budget Conscious") },
        { label: "Engagement", key: "engagement", color: getPersonaColor("Methodical") },
    ];

    return (
        <div className="space-y-8 pb-10">
            {/* Header / Stats Row */}
            <div className="flex flex-wrap items-end justify-between gap-6 border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Dashboard Overview</h1>
                    <p className="text-slate-400 max-w-2xl">
                        Analysis of {stats?.total_users || 0} users across {stats?.total_sessions || 0} sessions.
                        Data source: {stats?.mode === 'SAMPLE' ? 'Sampled Dataset (GitHub Pages Mode)' : 'Full Dataset'}.
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-slate-900/50 px-5 py-3 rounded-xl border border-slate-800 text-center">
                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Users</div>
                        <div className="text-2xl font-bold text-white">{stats?.total_users}</div>
                    </div>
                    <div className="bg-slate-900/50 px-5 py-3 rounded-xl border border-slate-800 text-center">
                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Sessions</div>
                        <div className="text-2xl font-bold text-white">{stats?.total_sessions}</div>
                    </div>
                    <div className="bg-slate-900/50 px-5 py-3 rounded-xl border border-slate-800 text-center">
                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Avg Sess/User</div>
                        <div className="text-2xl font-bold text-sky-400">{stats?.avg_sessions_per_user}</div>
                    </div>
                </div>
            </div>

            {/* Metric Distributions */}
            <div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    Key Behavioral Metrics
                    <span className="text-xs font-normal text-slate-500 bg-slate-900 px-2 py-1 rounded-full border border-slate-800">
                        Population Distribution
                    </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 h-64">
                    {cards.map(c => (
                        <MetricHistogram
                            key={c.key}
                            users={users}
                            metricKey={c.key}
                            color={c.color}
                            label={c.label}
                        />
                    ))}
                </div>
            </div>


            {/* Archetype Behavioral Fingerprint Radar */}
            <div className="bg-slate-800/20 rounded-xl p-6 border border-slate-800/50">
                <h3 className="text-lg font-bold text-white mb-2">Persona Archetype Behavioral Fingerprints</h3>
                <p className="text-slate-400 text-sm mb-6">
                    Comparison of ideal behavioral patterns for each persona archetype. Hover to highlight.
                </p>
                <div className="h-[500px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                            { subject: 'Decisiveness', 'Decisive Shopper': 0.9, 'Explorer': 0.3, 'Researcher': 0.4, 'Budget Conscious': 0.5, 'Methodical': 0.5 },
                            { subject: 'Exploration', 'Decisive Shopper': 0.3, 'Explorer': 0.9, 'Researcher': 0.6, 'Budget Conscious': 0.4, 'Methodical': 0.5 },
                            { subject: 'Research', 'Decisive Shopper': 0.4, 'Explorer': 0.5, 'Researcher': 0.9, 'Budget Conscious': 0.6, 'Methodical': 0.5 },
                            { subject: 'Price Sens.', 'Decisive Shopper': 0.2, 'Explorer': 0.4, 'Researcher': 0.5, 'Budget Conscious': 0.9, 'Methodical': 0.5 },
                            { subject: 'Engagement', 'Decisive Shopper': 0.6, 'Explorer': 0.7, 'Researcher': 0.8, 'Budget Conscious': 0.6, 'Methodical': 0.5 },
                        ]}
                            onMouseLeave={() => setHoveredPersona(null)}
                        >
                            <PolarGrid stroke="#334155" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} axisLine={false} />
                            <Radar name="Decisive Shopper" dataKey="Decisive Shopper" stroke="#22c55e" fill="#22c55e"
                                fillOpacity={hoveredPersona === null || hoveredPersona === 'Decisive Shopper' ? 0.25 : 0.05}
                                strokeWidth={hoveredPersona === 'Decisive Shopper' ? 3 : 1}
                                strokeOpacity={hoveredPersona === null || hoveredPersona === 'Decisive Shopper' ? 1 : 0.3}
                            />
                            <Radar name="Explorer" dataKey="Explorer" stroke="#3b82f6" fill="#3b82f6"
                                fillOpacity={hoveredPersona === null || hoveredPersona === 'Explorer' ? 0.25 : 0.05}
                                strokeWidth={hoveredPersona === 'Explorer' ? 3 : 1}
                                strokeOpacity={hoveredPersona === null || hoveredPersona === 'Explorer' ? 1 : 0.3}
                            />
                            <Radar name="Researcher" dataKey="Researcher" stroke="#f97316" fill="#f97316"
                                fillOpacity={hoveredPersona === null || hoveredPersona === 'Researcher' ? 0.25 : 0.05}
                                strokeWidth={hoveredPersona === 'Researcher' ? 3 : 1}
                                strokeOpacity={hoveredPersona === null || hoveredPersona === 'Researcher' ? 1 : 0.3}
                            />
                            <Radar name="Budget Conscious" dataKey="Budget Conscious" stroke="#a855f7" fill="#a855f7"
                                fillOpacity={hoveredPersona === null || hoveredPersona === 'Budget Conscious' ? 0.25 : 0.05}
                                strokeWidth={hoveredPersona === 'Budget Conscious' ? 3 : 1}
                                strokeOpacity={hoveredPersona === null || hoveredPersona === 'Budget Conscious' ? 1 : 0.3}
                            />
                            <Radar name="Methodical" dataKey="Methodical" stroke="#64748b" fill="#64748b"
                                fillOpacity={hoveredPersona === null || hoveredPersona === 'Methodical' ? 0.25 : 0.05}
                                strokeWidth={hoveredPersona === 'Methodical' ? 3 : 1}
                                strokeOpacity={hoveredPersona === null || hoveredPersona === 'Methodical' ? 1 : 0.3}
                            />
                            <Legend
                                wrapperStyle={{ fontSize: '12px', paddingTop: '10px', cursor: 'pointer' }}
                                onMouseEnter={(e) => setHoveredPersona(e.value)}
                                onMouseLeave={() => setHoveredPersona(null)}
                            />
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#e2e8f0', fontSize: '12px' }} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default OverviewView;
