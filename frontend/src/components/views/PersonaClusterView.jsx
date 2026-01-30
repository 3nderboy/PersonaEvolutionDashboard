import React, { useState, useEffect, useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { UserProfileCard } from './UserProfileView';
import ClusterPersonaCard from './ClusterPersonaCard';

// Cluster colors matching new persona names
const CLUSTER_COLORS = [
    '#22c55e', // Green - Cluster 0
    '#3b82f6', // Blue - Cluster 1  
    '#f97316', // Orange - Cluster 2
    '#a855f7', // Purple - Cluster 3
    '#ec4899', // Pink - Cluster 4
    '#14b8a6', // Teal - Cluster 5
    '#eab308', // Yellow - Cluster 6
];

const getClusterColor = (clusterId) => CLUSTER_COLORS[clusterId % CLUSTER_COLORS.length];

// Format BKM names for display
const formatMetricName = (name) => {
    return name
        .replace(/_/g, ' ')
        .replace(/ratio/gi, '')
        .replace(/seconds/gi, '')
        .trim()
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
};

// Persona Detail Panel Component
const PersonaDetailPanel = ({ persona, onClose, sessions = [], selectedMonth, onMonthChange, availableMonths = [], clusterPersona }) => {

    // Filter sessions for this persona in this month
    const monthSessions = useMemo(() => {
        if (!sessions || !selectedMonth || !persona) return [];
        return sessions.filter(s =>
            s.cluster_id === persona.cluster_id &&
            s.month === selectedMonth
        );
    }, [sessions, selectedMonth, persona]);

    // Calculate monthly average metrics
    const monthlyMetrics = useMemo(() => {
        if (monthSessions.length === 0 || !persona) return persona?.behavioral_metrics;

        const sums = {};
        const count = monthSessions.length;
        const keys = Object.keys(monthSessions[0].behavioral_metrics);

        keys.forEach(key => sums[key] = 0);

        monthSessions.forEach(s => {
            Object.entries(s.behavioral_metrics).forEach(([key, val]) => {
                sums[key] += val;
            });
        });

        const avgs = {};
        keys.forEach(key => {
            // Keep original Z-Score for reference (as we can't recompute it easily), but update Value
            avgs[key] = {
                value: sums[key] / count,
                z_score: persona.behavioral_metrics[key]?.z_score || 0
            };
        });

        return avgs;
    }, [monthSessions, persona]);

    // Finds representative session for this month (closest to monthly average)
    const monthRepSession = useMemo(() => {
        if (monthSessions.length === 0 || !persona) return persona?.representative_session;

        // Simple: just take the one closest to the average vector
        let bestSession = monthSessions[0];
        let minDist = Infinity;

        monthSessions.forEach(session => {
            let dist = 0;
            Object.keys(monthlyMetrics).forEach(key => {
                const diff = session.behavioral_metrics[key] - monthlyMetrics[key].value;
                dist += diff * diff;
            });

            if (dist < minDist) {
                minDist = dist;
                bestSession = session;
            }
        });

        return bestSession;
    }, [monthSessions, monthlyMetrics, persona]);

    // Render nothing if no persona (but hooks have run)
    if (!persona) return null;

    const metrics = monthlyMetrics || {};
    const rep = monthRepSession || {};
    const traits = persona.distinguishing_traits || { high: [], low: [] };
    const sessionCount = monthSessions.length > 0 ? monthSessions.length : 0;

    // Prepare radar data
    const radarData = Object.entries(metrics).map(([key, data]) => ({
        metric: formatMetricName(key),
        value: data.value,
        fullMark: 1
    }));

    // Prepare bar data for z-scores (Using Global Archetype Z-Scores)
    const barData = Object.entries(persona.behavioral_metrics) // Use global for Z-scores
        .map(([key, data]) => ({
            metric: formatMetricName(key),
            z_score: data.z_score,
            fill: data.z_score > 1 ? '#22c55e' : data.z_score < -1 ? '#ef4444' : '#64748b'
        }))
        .sort((a, b) => b.z_score - a.z_score);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex justify-between items-start z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: getClusterColor(persona.cluster_id) }}
                            />
                            <h2 className="text-2xl font-bold text-white">{persona.name}</h2>
                        </div>
                        <p className="text-slate-400">{persona.description}</p>
                        <div className="flex gap-4 mt-3 text-sm">
                            {/* <span className="text-slate-500">Cluster {persona.cluster_id}</span> */}
                            <div className="flex flex-col gap-1">
                                <span className="text-sky-400">Cluster with in total {sessionCount} sessions</span>
                                {/* <span className="text-xs text-slate-500">{clusterPersona?.user_count ?? 0} of them have user profiles (used for Persona-Synthesis)</span> */}
                            </div>
                        </div>

                        {/* Month Switcher inside Modal */}
                        <div className="flex gap-2 mt-4">
                            {availableMonths.map(m => (
                                <button
                                    key={m}
                                    onClick={() => onMonthChange && onMonthChange(m)}
                                    className={`
                                        px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                                        ${selectedMonth === m
                                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/50'
                                            : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white'
                                        }
                                    `}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white text-2xl font-light"
                    >
                        ×
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Distinguishing Traits */}
                    {traits.high.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                Distinguishing Traits
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {traits.high.map((t, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-green-500/20 text-green-300 rounded-full text-sm">
                                        ↑ {formatMetricName(t.metric)} ({t.z_score.toFixed(1)}σ)
                                    </span>
                                ))}
                                {traits.low.map((t, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-red-500/20 text-red-300 rounded-full text-sm">
                                        ↓ {formatMetricName(t.metric)} ({t.z_score.toFixed(1)}σ)
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Metrics Visualization */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Radar Chart */}
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                            <h4 className="text-sm font-semibold text-slate-300 mb-4">Behavioral Profile</h4>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart data={radarData}>
                                        <PolarGrid stroke="#334155" />
                                        <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                        <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} />
                                        <Radar
                                            dataKey="value"
                                            stroke={getClusterColor(persona.cluster_id)}
                                            fill={getClusterColor(persona.cluster_id)}
                                            fillOpacity={0.3}
                                            strokeWidth={2}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Z-Score Bar Chart */}
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                            <h4 className="text-sm font-semibold text-slate-300 mb-4">Deviation from Average (Z-Score)</h4>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barData} layout="vertical" margin={{ left: 80 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis type="number" domain={[-3, 7]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                                        <YAxis type="category" dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 10 }} width={75} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', fontSize: 12 }}
                                            formatter={(value) => [`${value.toFixed(2)}σ`, 'Z-Score']}
                                        />
                                        <Bar dataKey="z_score" radius={[0, 4, 4, 0]}>
                                            {barData.map((entry, index) => (
                                                <Cell key={index} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Cluster Persona */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                            Cluster Persona
                        </h3>
                        <ClusterPersonaCard
                            clusterPersona={clusterPersona}
                            clusterName={persona.name}
                            clusterColor={getClusterColor(persona.cluster_id)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Session Detail Panel Component (for individual session clicks)
const SessionDetailPanel = ({ session, personas, userProfiles, onClose }) => {
    if (!session) return null;

    const persona = personas.find(p => p.cluster_id === session.cluster_id);
    const metrics = session.behavioral_metrics || {};


    // Format session time from ID
    const getSessionTime = (sessionId) => {
        const parts = sessionId.split('_');
        if (parts.length >= 3) {
            const start = parts[parts.length - 2];
            const end = parts[parts.length - 1];
            try {
                const startDate = new Date(start);
                const endDate = new Date(end);
                const duration = Math.round((endDate - startDate) / 1000 / 60);
                return {
                    date: startDate.toLocaleDateString(),
                    time: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    duration: `${duration} min`
                };
            } catch {
                return null;
            }
        }
        return null;
    };

    const timeInfo = getSessionTime(session.session_id);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex justify-between items-start z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: getClusterColor(session.cluster_id) }}
                            />
                            <h2 className="text-xl font-bold text-white">Session Details</h2>
                        </div>
                        <p className="text-slate-400 text-sm">
                            Belongs to: <span className="text-white">{persona?.name || `Cluster ${session.cluster_id}`}</span>
                        </p>
                        {timeInfo && (
                            <div className="flex gap-4 mt-2 text-xs text-slate-500">
                                <span>{timeInfo.date}</span>
                                <span>{timeInfo.time}</span>
                                <span className="text-sky-400">{timeInfo.duration}</span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white text-2xl font-light"
                    >
                        ×
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Behavioral Metrics Radar */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                            Behavioral Profile
                        </h3>
                        <div className="h-64 bg-slate-800/30 rounded-xl p-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={Object.entries(metrics).map(([key, value]) => ({
                                    metric: formatMetricName(key),
                                    value: value,
                                    fullMark: 1
                                }))}>
                                    <PolarGrid stroke="#334155" />
                                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                                    <PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} />
                                    <Radar
                                        dataKey="value"
                                        stroke={getClusterColor(session.cluster_id)}
                                        fill={getClusterColor(session.cluster_id)}
                                        fillOpacity={0.3}
                                        strokeWidth={2}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* User Profile from LLM (New) */}
                    {userProfiles && session && (
                        (() => {
                            const userProfile = userProfiles.find(p => p.user_id === session.user_id);
                            if (userProfile) {
                                return (
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                            User Profile (LLM Extracted)
                                        </h3>
                                        <UserProfileCard userProfile={userProfile} />
                                    </div>
                                );
                            }
                            // No user profile available
                            return (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                        User Profile
                                    </h3>
                                    <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/30 text-center">
                                        <div className="text-4xl mb-3">📝</div>
                                        <div className="text-slate-400 mb-2">No user profile available for this session</div>
                                        <div className="text-slate-500 text-sm max-w-md mx-auto">
                                            User profiles are generated from interview transcripts. This user has no transcript data available.
                                        </div>
                                    </div>
                                </div>
                            );
                        })()
                    )}
                </div>
            </div>
        </div>
    );
};

// Main View Component
const PersonaClusterView = () => {
    const [personas, setPersonas] = useState([]);
    const [userProfiles, setUserProfiles] = useState([]);
    const [monthlyData, setMonthlyData] = useState({});
    const [sessions, setSessions] = useState([]);
    const [clusterPersonas, setClusterPersonas] = useState({});
    const [metadata, setMetadata] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [selectedPersona, setSelectedPersona] = useState(null);
    const [selectedSession, setSelectedSession] = useState(null);
    const [showSessions, setShowSessions] = useState(false);
    const [devFilterLLMUsersOnly, setDevFilterLLMUsersOnly] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const baseUrl = import.meta.env.BASE_URL;

                const [personasRes, monthlyRes, metaRes, sessionsRes, usersRes] = await Promise.all([
                    fetch(`${baseUrl}data/personas/personas.json`),
                    fetch(`${baseUrl}data/personas/monthly_clusters.json`),
                    fetch(`${baseUrl}data/personas/metadata.json`),
                    fetch(`${baseUrl}data/personas/sessions.json`),
                    fetch(`${baseUrl}data/users/llm_users.json`)
                ]);

                if (!personasRes.ok || !monthlyRes.ok || !metaRes.ok) {
                    throw new Error('Failed to load persona data');
                }

                const personasData = await personasRes.json();
                const monthlyDataRaw = await monthlyRes.json();
                const metaData = await metaRes.json();
                const sessionsData = sessionsRes.ok ? await sessionsRes.json() : [];
                const userProfilesData = usersRes.ok ? await usersRes.json() : [];

                setPersonas(personasData);
                setMonthlyData(monthlyDataRaw);
                setMetadata(metaData);
                setSessions(sessionsData);
                setUserProfiles(userProfilesData);

                // Load cluster personas dynamically
                const loadedClusterPersonas = {};
                const months = metaData?.months || [];
                const clusterIds = personasData.map(p => p.cluster_id);

                for (const month of months) {
                    for (const clusterId of clusterIds) {
                        const filename = `${month.replace(' ', '_').replace('(', '').replace(')', '')}_cluster_${clusterId}.json`;
                        try {
                            const res = await fetch(`${baseUrl}data/personas/cluster_personas/${filename}`);
                            if (res.ok) {
                                const personaData = await res.json();
                                const key = `${month}_${clusterId}`;
                                loadedClusterPersonas[key] = personaData;
                            }
                        } catch (e) {
                            // Cluster persona not available for this month/cluster
                        }
                    }
                }
                setClusterPersonas(loadedClusterPersonas);

                // Default to month with most sessions
                const monthsWithData = Object.entries(monthlyDataRaw)
                    .sort((a, b) => b[1].total_sessions - a[1].total_sessions);
                if (monthsWithData.length > 0) {
                    setSelectedMonth(monthsWithData[0][0]);
                }
            } catch (err) {
                console.error('Error loading persona data:', err);
                setError(`Failed to load persona data: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Prepare scatter data for selected month - SORTED by cluster_id for consistent animation
    const scatterData = useMemo(() => {
        if (!selectedMonth || !monthlyData[selectedMonth]) return [];

        const currentMonthClusters = monthlyData[selectedMonth].clusters.reduce((acc, c) => {
            acc[c.cluster_id] = c;
            return acc;
        }, {});

        // Iterate over ALL personas to ensure stable array length/order
        return personas.map(persona => {
            const activeCluster = currentMonthClusters[persona.cluster_id];

            if (activeCluster) {
                return {
                    x: activeCluster.pca_x,
                    y: activeCluster.pca_y,
                    z: activeCluster.session_count * 100, // Scale for bubble size
                    cluster_id: activeCluster.cluster_id,
                    name: persona.name,
                    session_count: activeCluster.session_count,
                    color: getClusterColor(activeCluster.cluster_id)
                };
            } else {
                // Placeholder for missing cluster (invisible but maintains position/color)
                return {
                    x: persona.centroid.pca_x, // Use global centroid position to prevent flying
                    y: persona.centroid.pca_y,
                    z: 0, // Invisible (size 0)
                    cluster_id: persona.cluster_id,
                    name: persona.name,
                    session_count: 0,
                    color: getClusterColor(persona.cluster_id),
                    isEmpty: true
                };
            }
        });
    }, [selectedMonth, monthlyData, personas]);

    // Prepare individual session scatter data for selected month
    const sessionScatterData = useMemo(() => {
        if (!selectedMonth || !sessions.length) return [];

        return sessions
            .filter(s => {
                const inMonth = s.month === selectedMonth;
                if (!inMonth) return false;
                if (devFilterLLMUsersOnly) {
                    return userProfiles.some(u => u.user_id === s.user_id);
                }
                return true;
            })
            .map(session => ({
                x: session.pca_x,
                y: session.pca_y,
                z: 50, // Small fixed size
                cluster_id: session.cluster_id,
                session_id: session.session_id,
                color: getClusterColor(session.cluster_id)
            }));
    }, [selectedMonth, sessions, devFilterLLMUsersOnly, userProfiles]);

    const handleClusterClick = (data) => {
        const persona = personas.find(p => p.cluster_id === data.cluster_id);
        if (persona) {
            setSelectedPersona(persona);
        }
    };

    const handleSessionClick = (data) => {
        // Find the full session data
        const fullSession = sessions.find(s => s.session_id === data.session_id);
        if (fullSession) {
            setSelectedSession(fullSession);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-slate-400">Loading persona clusters...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-red-400 text-center">
                    <p className="text-lg font-semibold mb-2">Failed to load data</p>
                    <p className="text-sm">{error}</p>
                    <p className="text-xs text-slate-500 mt-4">
                        Make sure to run the persona_clustering.py script first.
                    </p>
                </div>
            </div>
        );
    }

    const sortedMonths = metadata?.months?.sort() || [];

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="border-b border-slate-800 pb-6">
                <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
                    Behavioral Persona Clusters
                </h1>
                <p className="text-slate-400 max-w-3xl">
                    Sessions clustered by Behavioral Key Metrics. Each cluster represents a distinct
                    shopping behavior pattern. Click a cluster to view persona details.
                </p>
                <div className="flex gap-4 mt-4 text-sm">
                    <span className="text-slate-500">
                        <span className="text-white font-semibold">{metadata?.total_sessions}</span> sessions
                    </span>
                    <span className="text-slate-500">
                        <span className="text-white font-semibold">{metadata?.total_clusters}</span> personas
                    </span>
                    <span className="text-slate-500">
                        <span className="text-white font-semibold">{sortedMonths.length}</span> time periods
                    </span>
                </div>
            </div>

            {/* Month Selector */}
            <div className="flex gap-2">
                {sortedMonths.map(month => {
                    const monthData = monthlyData[month];
                    const isSelected = month === selectedMonth;

                    return (
                        <button
                            key={month}
                            onClick={() => setSelectedMonth(month)}
                            className={`
                                px-4 py-2 rounded-lg transition-all
                                ${isSelected
                                    ? 'bg-sky-500 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                                }
                            `}
                        >
                            <div className="text-sm font-semibold">{month}</div>
                            <div className="text-xs opacity-70">{monthData?.total_sessions || 0} sessions</div>
                        </button>
                    );
                })}
            </div>

            {/* Cluster Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Scatter Plot */}
                <div className="lg:col-span-2 bg-slate-800/30 rounded-xl p-6 border border-slate-700/30">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold text-white">
                            Cluster Distribution
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setDevFilterLLMUsersOnly(!devFilterLLMUsersOnly)}
                                className={`
                                    px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2
                                    ${devFilterLLMUsersOnly
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                                        : 'bg-slate-700 text-slate-400 border border-transparent hover:bg-slate-600'
                                    }
                                `}
                            >
                                <span className="text-[10px] bg-amber-500 text-black px-1 rounded font-bold">DEV</span>
                                Toggle Found User Profiles
                            </button>
                            <button
                                onClick={() => setShowSessions(!showSessions)}
                                className={`
                                    px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2
                                    ${showSessions
                                        ? 'bg-sky-500 text-white'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }
                                `}
                            >
                                <span className={`w-2 h-2 rounded-full ${showSessions ? 'bg-white' : 'bg-slate-400'}`} />
                                {showSessions ? 'Hide' : 'Show'} Sessions ({sessionScatterData.length})
                            </button>
                        </div>
                    </div>
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 30, bottom: 50, left: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis
                                    type="number"
                                    dataKey="x"
                                    domain={metadata?.pca_bounds ? [metadata.pca_bounds.x_min, metadata.pca_bounds.x_max] : ['auto', 'auto']}
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    axisLine={{ stroke: '#475569' }}
                                    tickFormatter={(v) => v.toFixed(1)}
                                    label={{
                                        value: '← Browsing / Researching          Purchasing / Action →',
                                        position: 'bottom',
                                        offset: 25,
                                        fill: '#64748b',
                                        fontSize: 11
                                    }}
                                />
                                <YAxis
                                    type="number"
                                    dataKey="y"
                                    domain={metadata?.pca_bounds ? [metadata.pca_bounds.y_min, metadata.pca_bounds.y_max] : ['auto', 'auto']}
                                    tick={{ fill: '#94a3b8', fontSize: 10 }}
                                    axisLine={{ stroke: '#475569' }}
                                    tickFormatter={(v) => v.toFixed(1)}
                                    label={{
                                        value: '← Quick Sessions    Long Sessions →',
                                        angle: -90,
                                        position: 'left',
                                        offset: 40,
                                        fill: '#64748b',
                                        fontSize: 11
                                    }}
                                />
                                <ZAxis type="number" dataKey="z" range={[200, 2000]} />
                                <Tooltip
                                    cursor={{ strokeDasharray: '3 3' }}
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        borderColor: '#334155',
                                        borderRadius: '8px'
                                    }}
                                    content={({ active, payload }) => {
                                        if (!active || !payload || !payload.length) return null;

                                        const data = payload[0].payload;

                                        // Don't show tooltip for empty placeholder clusters
                                        if (data.isEmpty) return null;
                                        // Check if it's a session or cluster
                                        if (data.session_id) {
                                            return (
                                                <div className="bg-slate-900 border border-slate-700 rounded-lg p-2 shadow-xl">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-2 h-2 rounded-full"
                                                            style={{ backgroundColor: data.color }}
                                                        />
                                                        <span className="text-xs text-slate-300">Session</span>
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-1">
                                                        Click to view details
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return (
                                            <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: data.color }}
                                                    />
                                                    <span className="font-semibold text-white">{data.name}</span>
                                                </div>
                                                <div className="text-sm text-slate-400">
                                                    Cluster with in total {data.session_count} sessions
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1">
                                                    Click to view details
                                                </div>
                                            </div>
                                        );
                                    }
                                    }
                                />
                                {/* Individual Sessions (rendered first = behind) */}
                                {showSessions && (
                                    <Scatter
                                        data={sessionScatterData}
                                        shape="circle"
                                        onClick={handleSessionClick}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {sessionScatterData.map((entry) => (
                                            <Cell
                                                key={`session-${entry.session_id}`}
                                                fill={entry.color}
                                                fillOpacity={0.4}
                                                stroke={entry.color}
                                                strokeOpacity={0.7}
                                                strokeWidth={1}
                                                r={5}
                                            />
                                        ))}
                                    </Scatter>
                                )}
                                {/* Cluster Centroids (rendered last = on top) */}
                                <Scatter
                                    data={scatterData}
                                    onClick={handleClusterClick}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {scatterData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                            fillOpacity={entry.isEmpty ? 0 : 0.9}
                                            stroke={entry.isEmpty ? 'transparent' : '#fff'}
                                            strokeWidth={2}
                                            style={{ pointerEvents: entry.isEmpty ? 'none' : 'auto' }}
                                        />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Persona List */}
                <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/30">
                    <h3 className="text-lg font-semibold text-white mb-4">Personas</h3>
                    <div className="space-y-3">
                        {personas.map(persona => {
                            const monthCluster = monthlyData[selectedMonth]?.clusters?.find(
                                c => c.cluster_id === persona.cluster_id
                            );
                            const sessionCount = monthCluster?.session_count || 0;

                            return (
                                <button
                                    key={persona.cluster_id}
                                    onClick={() => setSelectedPersona(persona)}
                                    className="w-full text-left p-4 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg border border-slate-700/50 hover:border-slate-600 transition group"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: getClusterColor(persona.cluster_id) }}
                                        />
                                        <span className="font-semibold text-white group-hover:text-sky-400 transition">
                                            {persona.name}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 mb-2 line-clamp-2">
                                        {persona.description}
                                    </p>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">
                                            {sessionCount} sessions this month
                                        </span>
                                        <span className="text-slate-500">
                                            {persona.session_count} total
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Persona Detail Modal */}
            {selectedPersona && (
                <PersonaDetailPanel
                    persona={selectedPersona}
                    onClose={() => setSelectedPersona(null)}
                    sessions={sessions}
                    selectedMonth={selectedMonth}
                    onMonthChange={setSelectedMonth}
                    availableMonths={sortedMonths}
                    clusterPersona={clusterPersonas[`${selectedMonth}_${selectedPersona.cluster_id}`]}
                />
            )}

            {/* Session Detail Modal */}
            {selectedSession && (
                <SessionDetailPanel
                    session={selectedSession}
                    personas={personas}
                    userProfiles={userProfiles}
                    onClose={() => setSelectedSession(null)}
                />
            )}
        </div>
    );
};

export default PersonaClusterView;
