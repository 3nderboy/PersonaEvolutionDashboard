import React, { useRef, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import PersonaRadarChart from '../charts/PersonaRadarChart';
import { getPersonaColor } from '../../utils/colors';

const UserDetailModal = ({ user, onClose }) => {
    // Backdrop click handler
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!user) return null;

    const pColor = getPersonaColor(user.persona_type);

    // Mock data for session evolution if not present (simplified for modal)
    // Ideally we fetch this, but for now we generate a curve based on "sessions_count"
    const sessionData = Array.from({ length: user.sessions_count || 10 }, (_, i) => ({
        session: i + 1,
        engagement: 0.5 + Math.random() * 0.5, // Placeholder
        // If we had real session stats loaded, we'd use them
    }));

    return (
        <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick} // Close on backdrop click
        >
            <div className="bg-slate-900 w-full max-w-5xl max-h-[90vh] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className={`p-6 border-b border-slate-800 flex justify-between items-start ${pColor.bg}`}>
                    <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl shadow-lg border-2 border-white/30 text-black/80`}>
                            {user.user_id.slice(0, 2)}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-bold text-black font-mono">{user.user_id}</h2>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold bg-white/20 border border-white/30 text-black`}>
                                    {user.persona_type}
                                </span>
                            </div>
                            <div className="text-black/70 text-sm mt-1 flex gap-4">
                                <span>{user.sessions_count || 0} Sessions</span>
                                <span>•</span>
                                <span>{user.total_actions || 0} Actions</span>
                                <span>•</span>
                                <span>First seen: {new Date().toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-black/70 hover:text-black transition bg-white/20 hover:bg-white/40 rounded-lg p-2"
                    >
                        ✕ Close
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Left Column: Stats & Radar */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Radar Chart */}
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                                <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Behavioral Fingerprint</h3>
                                <div className="h-64">
                                    <PersonaRadarChart
                                        data={[user]}
                                        color={pColor.hex}
                                        width={300}
                                        height={250}
                                        className="mx-auto"
                                    />
                                </div>
                            </div>

                            {/* Impact Factors */}
                            <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50">
                                <h3 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">Why {user.persona_type}?</h3>
                                <div className="space-y-2">
                                    {Object.entries(user.impact_factors || {}).map(([key, factors]) => (
                                        factors.length > 0 && (
                                            <div key={key} className="p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                                                <div className={`text-xs font-bold uppercase mb-1 ${pColor.text}`}>{key.replace('_', ' ')}</div>
                                                <div className="flex flex-wrap gap-1">
                                                    {factors.map((f, i) => (
                                                        <span key={i} className="text-xs text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                                                            {f}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Evolution & Details */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Profile Summary Text */}
                            <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                                <h3 className="text-lg font-bold text-white mb-2">User Profile</h3>
                                <p className="text-slate-300 leading-relaxed">
                                    This user demonstrates a <strong>{user.persona_type}</strong> behavior pattern.
                                    With a decisiveness score of <strong>{(user.behavioral_metrics?.decisiveness * 100).toFixed(0)}%</strong>,
                                    they tend to {user.behavioral_metrics?.decisiveness > 0.6 ? 'make quick purchase decisions' : 'spend time evaluating options'}.
                                    Their exploration score ({(user.behavioral_metrics?.exploration * 100).toFixed(0)}%) suggests they
                                    {user.behavioral_metrics?.exploration > 0.6 ? ' browse broadly across categories' : ' focus narrowly on specific items'}.
                                </p>

                                {user.transcribed_interview && (
                                    <div className="mt-4 p-4 bg-slate-950/50 rounded-lg border border-slate-800 italic text-slate-400 text-sm">
                                        <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase text-slate-500 not-italic">
                                            <span>💬 User Interview</span>
                                        </div>
                                        "{user.transcribed_interview}"
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDetailModal;
