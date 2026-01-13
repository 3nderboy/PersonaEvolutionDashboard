import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loadData } from '../../utils/dataLoader';

// Sessions View Component
const SessionsView = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const userFilter = searchParams.get('user');

    const [sessions, setSessions] = useState([]);
    const [filteredSessions, setFilteredSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortField, setSortField] = useState('start_ts');
    const [sortDir, setSortDir] = useState('desc');

    // Toggle Filter State: default to TRUE (Show only available) per user preference for usability, 
    // but they asked for a "filter". Defaults matter. Let's default to TRUE to ensure "Sessions is working" feeling.
    const [showAvailableOnly, setShowAvailableOnly] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const data = await loadData('sessions.json');
                setSessions(data);
                setError(null);
            } catch (err) {
                console.error(err);
                setError(err.message);
                setSessions([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Filter Logic
    useEffect(() => {
        let res = sessions;

        // 1. User Filter
        if (userFilter) {
            res = res.filter(s => s.user_id === userFilter);
        }

        // 2. Timeline Availability Filter
        if (showAvailableOnly) {
            res = res.filter(s => s.timeline_available);
        }

        setFilteredSessions(res);
    }, [sessions, userFilter, showAvailableOnly]);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('desc');
        }
    };

    const sortedSessions = [...filteredSessions].sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];

        if (aVal === null) aVal = sortDir === 'asc' ? Infinity : -Infinity;
        if (bVal === null) bVal = sortDir === 'asc' ? Infinity : -Infinity;

        if (typeof aVal === 'string') {
            return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

    const formatDuration = (seconds) => {
        if (!seconds) return '—';
        if (seconds < 60) return `${Math.round(seconds)}s`;
        if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
        return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
    };

    const SortHeader = ({ field, label }) => (
        <th
            className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-sky-400 transition"
            onClick={() => handleSort(field)}
        >
            <div className="flex items-center gap-1">
                {label}
                {sortField === field && (
                    <span className="text-sky-400">{sortDir === 'asc' ? '↑' : '↓'}</span>
                )}
            </div>
        </th>
    );

    if (loading) return <div className="text-center py-20 text-slate-500">Loading sessions...</div>;

    return (
        <div className="col-span-3 space-y-4">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-white">Sessions</h2>
                        {userFilter && (
                            <button
                                onClick={() => navigate('/sessions')}
                                className="text-xs text-sky-400 hover:text-sky-300 px-2 py-1 bg-sky-500/20 rounded-full"
                            >
                                Clear user filter ×
                            </button>
                        )}
                    </div>
                    <p className="text-slate-400 text-sm">
                        Showing {sortedSessions.length} sessions
                        {userFilter && ` for user ${userFilter.slice(0, 8)}...`}
                    </p>
                </div>

                {/* Filter Toggle */}
                <div className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                    <span className="text-sm text-slate-300">Filter:</span>
                    <button
                        onClick={() => setShowAvailableOnly(!showAvailableOnly)}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-2 ${showAvailableOnly
                            ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20'
                            : 'bg-slate-700 text-slate-400 hover:text-white'
                            }`}
                    >
                        {showAvailableOnly ? '✅ Timeline Available' : '□ Show All'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* Table */}
            <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-900/50">
                            <tr>
                                <SortHeader field="session_id" label="Session ID" />
                                <SortHeader field="user_id" label="User" />
                                <SortHeader field="start_ts" label="Started" />
                                <SortHeader field="duration_sec" label="Duration" />
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {sortedSessions.map((session) => (
                                <tr
                                    key={session.session_id}
                                    className="hover:bg-slate-700/30"
                                >
                                    <td className="px-4 py-3 text-sm font-mono text-sky-400">
                                        {session.session_id.slice(0, 24)}...
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-300">
                                        {session.user_id.slice(0, 8)}...
                                    </td>

                                    <td className="px-4 py-3 text-sm text-slate-400">
                                        {session.start_ts ? new Date(session.start_ts).toLocaleString() : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-300">
                                        {formatDuration(session.duration_sec)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${session.action_count >= 20
                                            ? 'bg-green-500/20 text-green-400'
                                            : session.action_count >= 10
                                                ? 'bg-sky-500/20 text-sky-400'
                                                : 'bg-slate-600/30 text-slate-400'
                                            }`}>
                                            {session.action_count}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {sortedSessions.length === 0 && !error && (
                    <div className="py-10 text-center text-slate-500">
                        {showAvailableOnly
                            ? "No sessions with timelines found for this user."
                            : "No sessions found."}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SessionsView;
