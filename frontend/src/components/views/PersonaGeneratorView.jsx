import React, { useState, useEffect } from 'react';

/**
 * PersonaGeneratorView - Displays LLM-extracted personas
 * Loads data from /data/personas/{user_id}.json files
 */
const PersonaGeneratorView = () => {
    const [personas, setPersonas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPersona, setSelectedPersona] = useState(null);

    useEffect(() => {
        loadPersonas();
    }, []);

    const loadPersonas = async () => {
        try {
            // Use Vite's BASE_URL for proper path resolution
            const baseUrl = import.meta.env.BASE_URL || '/';
            const response = await fetch(`${baseUrl}data/personas/llm_personas.json`);

            // If file doesn't exist (404), show empty state instead of error
            if (!response.ok) {
                setPersonas([]);
                setLoading(false);
                return;
            }

            const data = await response.json();

            // Filter to only include LLM-extracted personas (have a "persona" field with demographics)
            const llmPersonas = data.filter(p =>
                p.persona && p.persona.demographics
            );

            setPersonas(llmPersonas);
            if (llmPersonas.length > 0) {
                setSelectedPersona(llmPersonas[0]);
            }
        } catch (err) {
            // JSON parse error or network error - show empty state
            setPersonas([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-slate-400">Loading personas...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
                <div className="text-red-400 text-lg mb-2">Failed to load personas</div>
                <div className="text-slate-500 text-sm">{error}</div>
            </div>
        );
    }

    if (personas.length === 0) {
        return (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center">
                <div className="text-4xl mb-4">🤖</div>
                <div className="text-slate-300 text-lg mb-2">No LLM-Extracted Personas Yet</div>
                <div className="text-slate-500 text-sm max-w-md mx-auto">
                    Run the extraction script to generate personas from interview transcripts:
                    <code className="block mt-3 bg-slate-900 px-4 py-2 rounded-lg text-sky-400 text-xs">
                        python backend/scripts/extract_personas.py
                    </code>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">LLM-Extracted Personas</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {personas.length} persona{personas.length !== 1 ? 's' : ''} extracted from interview transcripts
                    </p>
                </div>
                <div className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg text-sm font-medium">
                    ✓ {personas.length} Processed
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* Persona List */}
                <div className="col-span-4 space-y-3">
                    {personas.map((p) => (
                        <button
                            key={p.user_id}
                            onClick={() => setSelectedPersona(p)}
                            className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${selectedPersona?.user_id === p.user_id
                                ? 'bg-sky-500/20 border border-sky-500/50'
                                : 'bg-slate-800/50 border border-slate-700/50 hover:border-slate-600'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                    {p.persona?.demographics?.gender?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-white font-medium truncate">
                                        {p.persona?.demographics?.occupation || 'Unknown Occupation'}
                                    </div>
                                    <div className="text-slate-400 text-xs truncate">
                                        {p.persona?.demographics?.location || 'Unknown Location'}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Persona Detail */}
                <div className="col-span-8">
                    {selectedPersona && (
                        <PersonaCard persona={selectedPersona} />
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * PersonaCard - Displays detailed persona information
 */
const PersonaCard = ({ persona }) => {
    const p = persona.persona;

    if (!p) return null;

    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
            {/* Header with Narrative */}
            <div className="bg-gradient-to-r from-sky-500/20 to-purple-500/20 p-6 border-b border-slate-700/50">
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                        {p.demographics?.gender?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-white mb-1">
                            {p.demographics?.occupation || 'Unknown'}
                        </h2>
                        <p className="text-slate-300 text-sm leading-relaxed">
                            {p.narrative || 'No narrative available'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Demographics */}
                <Section title="Demographics" icon="👤">
                    <div className="grid grid-cols-2 gap-4">
                        <InfoItem label="Age Range" value={p.demographics?.age_range} />
                        <InfoItem label="Gender" value={p.demographics?.gender} />
                        <InfoItem label="Location" value={p.demographics?.location} />
                        <InfoItem label="Education" value={p.demographics?.education} />
                        <InfoItem label="Living Situation" value={p.demographics?.living_situation} />
                    </div>
                </Section>

                {/* Psychographics */}
                <Section title="Psychographics" icon="🧠">
                    <div className="space-y-4">
                        {p.psychographics?.lifestyle && (
                            <div className="text-slate-300 text-sm italic">
                                "{p.psychographics.lifestyle}"
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-4">
                            <TagList label="Personality Traits" items={p.psychographics?.personality_traits} color="sky" />
                            <TagList label="Interests" items={p.psychographics?.interests} color="purple" />
                            <TagList label="Values" items={p.psychographics?.values} color="emerald" />
                        </div>
                    </div>
                </Section>

                {/* Shopping Behavior */}
                <Section title="Shopping Behavior" icon="🛒">
                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <InfoItem label="Frequency" value={p.shopping_behavior?.frequency} />
                            <InfoItem label="Brand Loyalty" value={p.shopping_behavior?.brand_loyalty} />
                            <InfoItem label="Research Habits" value={p.shopping_behavior?.research_habits?.slice(0, 50) + '...'} />
                        </div>
                        <TagList label="Preferred Categories" items={p.shopping_behavior?.preferred_categories} color="orange" />
                        <TagList label="Decision Factors" items={p.shopping_behavior?.decision_factors} color="rose" />
                    </div>
                </Section>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700/50">
                <div className="text-xs text-slate-500">
                    User ID: <span className="text-slate-400 font-mono">{persona.user_id}</span>
                </div>
            </div>
        </div>
    );
};

/**
 * Section component for grouping persona data
 */
const Section = ({ title, icon, children }) => (
    <div>
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span>{icon}</span>
            {title}
        </h3>
        {children}
    </div>
);

/**
 * InfoItem component for key-value display
 */
const InfoItem = ({ label, value }) => (
    <div>
        <div className="text-xs text-slate-500 mb-1">{label}</div>
        <div className="text-sm text-slate-200">{value || '—'}</div>
    </div>
);

/**
 * TagList component for displaying arrays as tags
 */
const TagList = ({ label, items, color = 'sky' }) => {
    if (!items || items.length === 0) return null;

    const colorClasses = {
        sky: 'bg-sky-500/20 text-sky-300',
        purple: 'bg-purple-500/20 text-purple-300',
        emerald: 'bg-emerald-500/20 text-emerald-300',
        orange: 'bg-orange-500/20 text-orange-300',
        rose: 'bg-rose-500/20 text-rose-300',
    };

    return (
        <div>
            <div className="text-xs text-slate-500 mb-2">{label}</div>
            <div className="flex flex-wrap gap-2">
                {items.slice(0, 6).map((item, i) => (
                    <span
                        key={i}
                        className={`px-2 py-1 rounded-lg text-xs ${colorClasses[color]}`}
                    >
                        {item}
                    </span>
                ))}
                {items.length > 6 && (
                    <span className="px-2 py-1 rounded-lg text-xs bg-slate-700 text-slate-400">
                        +{items.length - 6} more
                    </span>
                )}
            </div>
        </div>
    );
};

export default PersonaGeneratorView;
