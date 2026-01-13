import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { loadData } from '../../utils/dataLoader';

const SessionDetailView = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterCategory, setFilterCategory] = useState('all');

    useEffect(() => {
        const fetchSessionData = async () => {
            try {
                // 1. Load basic session info from sessions.json to get safe_id
                const allSessions = await loadData('sessions.json');
                const foundSession = allSessions.find(s => s.session_id === sessionId);

                if (!foundSession) {
                    console.error("Session not found in manifest");
                    setLoading(false);
                    return;
                }
                setSession(foundSession);

                // 2. Load timeline using safe_id if available, else standard ID (legacy fallback)
                const timelineId = foundSession.safe_id || sessionId;
                const timelineData = await loadData(`timelines/${timelineId}.json`);
                setTimeline(timelineData || []);

            } catch (err) {
                console.error("Failed to load session details", err);
            } finally {
                setLoading(false);
            }
        };

        if (sessionId) {
            fetchSessionData();
        }
    }, [sessionId]);

    const handleBack = () => {
        navigate(-1);
    };

    if (loading) {
        return <div className="p-10 text-center text-slate-500">Loading Session Timeline...</div>;
    }

    if (!session) {
        return <div className="p-10 text-center text-red-400">Session not found.</div>;
    }

    // Colors for categories
    const categoryColors = {
        purchase_intent: 'bg-green-500',
        discovery: 'bg-blue-500',
        refinement: 'bg-purple-500',
        research: 'bg-orange-500',
        navigation: 'bg-slate-500'
    };

    const filteredTimeline = filterCategory === 'all'
        ? timeline
        : timeline.filter(t => t.category === filterCategory);

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <button onClick={handleBack} className="text-sm text-slate-400 hover:text-white mb-2 flex items-center gap-1">
                        ← Back to List
                    </button>
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-white font-mono">{sessionId.split('_')[0]}...</h2>
                        {session.session_type && (
                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                                {session.session_type}
                            </span>
                        )}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-sm text-slate-300">
                        {new Date(session.start_ts).toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500">
                        {session.action_count} Actions • {Math.round(session.duration_sec / 60)} min
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2 mb-6 p-1 bg-slate-800/50 rounded-lg border border-slate-700/50 w-fit">
                {['all', 'discovery', 'research', 'purchase_intent'].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilterCategory(cat)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${filterCategory === cat
                            ? 'bg-slate-700 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        {cat.replace('_', ' ').toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Timeline Visualization */}
            <div className="flex-1 overflow-y-auto pr-4 relative space-y-0">
                {/* Vertical Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-800"></div>

                {filteredTimeline.map((block, idx) => {
                    const color = categoryColors[block.category] || 'bg-slate-500';
                    const isLast = idx === filteredTimeline.length - 1;

                    return (
                        <div key={idx} className="relative pl-14 pb-8 group">
                            {/* Dot */}
                            <div className={`absolute left-[21px] top-1.5 w-3 h-3 rounded-full border-2 border-slate-900 ${color} z-10`}></div>

                            {/* Time */}
                            <div className="absolute left-0 top-1 w-12 text-[10px] text-slate-500 text-right font-mono">
                                {new Date(block.timestamp).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })}
                            </div>

                            {/* Content */}
                            <div className={`bg-slate-800/40 p-3 rounded-xl border border-slate-700/30 hover:bg-slate-800 transition ${block.is_anomaly ? 'ring-1 ring-red-500/50' : ''}`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold uppercase tracking-wider ${color.replace('bg-', 'text-')}`}>
                                            {block.click_type}
                                        </span>
                                        {block.is_anomaly && (
                                            <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 rounded uppercase font-bold">
                                                Attention
                                            </span>
                                        )}
                                    </div>
                                    {block.delay_from_previous_sec > 5 && (
                                        <span className="text-[10px] text-slate-500">
                                            +{Math.round(block.delay_from_previous_sec)}s delay
                                        </span>
                                    )}
                                </div>

                                {block.product && (
                                    <div className="mt-2 flex gap-3 p-2 bg-slate-900/50 rounded-lg border border-slate-800">
                                        <div className="w-8 h-8 bg-slate-800 rounded flex items-center justify-center text-xs">🛍️</div>
                                        <div>
                                            <div className="text-xs text-white font-medium line-clamp-1">{block.product.title}</div>
                                            <div className="text-[10px] text-green-400">{block.product.price}</div>
                                        </div>
                                    </div>
                                )}

                                {block.rationale && (
                                    <div className="mt-2 text-xs text-slate-300 italic">
                                        "{block.rationale}"
                                    </div>
                                )}

                                {block.input_text && (
                                    <div className="mt-2 text-xs font-mono text-sky-300 bg-sky-900/20 px-2 py-1 rounded w-fit">
                                        Input: {block.input_text}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {filteredTimeline.length === 0 && (
                    <div className="text-center py-10 text-slate-500 italic">
                        No events found for this filter.
                    </div>
                )}
            </div>
        </div>
    );
};

export default SessionDetailView;
