import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// Cluster colors
const CLUSTER_COLORS = ['#22c55e', '#3b82f6', '#f97316', '#a855f7', '#ec4899'];

const OverviewView = () => {
    const [personas, setPersonas] = useState([]);
    const [metadata, setMetadata] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hoveredPersona, setHoveredPersona] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const load = async () => {
            try {
                const baseUrl = import.meta.env.BASE_URL;
                const [personasRes, metaRes] = await Promise.all([
                    fetch(`${baseUrl}data/personas/personas.json`),
                    fetch(`${baseUrl}data/personas/metadata.json`)
                ]);

                if (personasRes.ok) setPersonas(await personasRes.json());
                if (metaRes.ok) setMetadata(await metaRes.json());
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <div className="text-center py-20 text-slate-500">Loading dashboard...</div>;

    // Compute radar data from personas' behavioral metrics
    const bkmLabels = {
        'session_duration_seconds': 'Session Duration',
        'action_density': 'Action Density',
        'total_action_count': 'Total Action Count',
        'purchase_intent_ratio': 'Purchase Intent Ratio',
        'search_ratio': 'Search Ratio',
        'product_exploration_ratio': 'Product Exploration Ratio',
        'review_engagement_ratio': 'Review Engagement Ratio',
        'filter_usage_ratio': 'Filter Usage Ratio',
        'option_selection_ratio': 'Option Selection Ratio',
        'input_ratio': 'Input Ratio'
    };

    // Build radar data
    const radarData = Object.keys(bkmLabels).map(key => {
        const point = { subject: bkmLabels[key] };
        personas.forEach(p => {
            point[p.name] = p.behavioral_metrics?.[key]?.value || 0;
        });
        return point;
    });

    return (
        <div className="space-y-8 pb-10">
            {/* Header / Stats Row */}
            <div className="flex flex-wrap items-end justify-between gap-6 border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Dashboard Overview</h1>
                    <p className="text-slate-400 max-w-2xl">
                        Behavioral persona analysis from OPeRA dataset. Click "Personas" to explore clusters.
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-slate-900/50 px-5 py-3 rounded-xl border border-slate-800 text-center">
                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Sessions</div>
                        <div className="text-2xl font-bold text-white">{metadata?.total_sessions || 0}</div>
                    </div>
                    <div className="bg-slate-900/50 px-5 py-3 rounded-xl border border-slate-800 text-center">
                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Personas</div>
                        <div className="text-2xl font-bold text-white">{metadata?.total_clusters || 0}</div>
                    </div>
                    <div className="bg-slate-900/50 px-5 py-3 rounded-xl border border-slate-800 text-center">
                        <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Time Periods</div>
                        <div className="text-2xl font-bold text-sky-400">{metadata?.months?.length || 0}</div>
                    </div>
                </div>
            </div>

            {/* Persona Cards */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        Generated Personas
                        <span className="text-xs font-normal text-slate-500 bg-slate-900 px-2 py-1 rounded-full border border-slate-800">
                            Cluster-based
                        </span>
                    </h2>
                    <button
                        onClick={() => navigate('/personas')}
                        className="text-sm text-sky-400 hover:text-sky-300 transition"
                    >
                        View Details →
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {personas.map((persona, i) => (
                        <button
                            key={persona.cluster_id}
                            onClick={() => navigate('/personas')}
                            className="text-left p-5 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl border border-slate-700/50 hover:border-slate-600 transition group"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: CLUSTER_COLORS[i % CLUSTER_COLORS.length] }}
                                />
                                <span className="font-semibold text-white group-hover:text-sky-400 transition">
                                    {persona.name}
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                                {persona.description}
                            </p>
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>{persona.session_count} sessions</span>
                                <span>Cluster {persona.cluster_id}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Archetype Behavioral Fingerprint Radar */}
            <div className="bg-slate-800/20 rounded-xl p-6 border border-slate-800/50">
                <h3 className="text-lg font-bold text-white mb-2">Persona Behavioral Fingerprints</h3>
                <p className="text-slate-400 text-sm mb-6">
                    Comparison of behavioral patterns for each persona cluster. Hover to highlight.
                </p>
                <div className="h-[500px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}
                            onMouseLeave={() => setHoveredPersona(null)}
                        >
                            <PolarGrid stroke="#334155" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 1]} tick={false} axisLine={false} />
                            {personas.map((persona, i) => (
                                <Radar
                                    key={persona.cluster_id}
                                    name={persona.name}
                                    dataKey={persona.name}
                                    stroke={CLUSTER_COLORS[i % CLUSTER_COLORS.length]}
                                    fill={CLUSTER_COLORS[i % CLUSTER_COLORS.length]}
                                    fillOpacity={hoveredPersona === null || hoveredPersona === persona.name ? 0.25 : 0.05}
                                    strokeWidth={hoveredPersona === persona.name ? 3 : 1}
                                    strokeOpacity={hoveredPersona === null || hoveredPersona === persona.name ? 1 : 0.3}
                                />
                            ))}
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
