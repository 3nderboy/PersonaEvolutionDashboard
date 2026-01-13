import React from 'react';

// Insight Card Component
const InsightCard = ({ user, layout = "vertical" }) => {
    if (!user || !user.persona_summary) return null;

    // Use a truncated version of the summary or pick a key sentence
    // Assuming summary is a paragraph, we take the first 1-2 sentences.
    const summary = user.persona_summary.split('. ').slice(0, 2).join('. ') + '.';
    const personaType = user.persona_type || "Unknown Persona";

    return (
        <div className={`bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 flex flex-col gap-3 relative overflow-hidden transition hover:bg-slate-800 hover:border-sky-500/30 ${layout === 'horizontal' ? 'lg:flex-row lg:items-center lg:gap-6' : ''}`}>
            {/* Quote Icon decorative background */}
            <div className="absolute top-2 right-4 text-7xl text-slate-800/50 font-serif leading-none select-none">”</div>

            <div className="flex-1 z-10">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 uppercase tracking-wide">
                        {personaType}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">User {user.user_id.slice(0, 6)}</span>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed italic">
                    "{summary}"
                </p>
            </div>
        </div>
    );
};

// Insight Cards Grid
const InsightCards = ({ users, count = 3 }) => {
    if (!users || users.length === 0) return null;

    // Pick top users or random users who have a summary
    const usersWithSummary = users.filter(u => u.persona_summary && u.persona_summary.length > 20);
    const displayedUsers = usersWithSummary.slice(0, count);

    if (displayedUsers.length === 0) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {displayedUsers.map(user => (
                <InsightCard key={user.user_id} user={user} />
            ))}
        </div>
    );
};

export default InsightCards;
