import React, { useState, useEffect } from 'react';

/**
 * UserProfileView - Displays LLM-extracted user profiles
 * Loads data from /data/users/llm_users.json
 */
const UserProfileView = () => {
    const [userProfiles, setUserProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProfile, setSelectedProfile] = useState(null);

    useEffect(() => {
        loadUserProfiles();
    }, []);

    const loadUserProfiles = async () => {
        try {
            const baseUrl = import.meta.env.BASE_URL || '/';
            const response = await fetch(`${baseUrl}data/users/llm_users.json`);

            if (!response.ok) {
                setUserProfiles([]);
                setLoading(false);
                return;
            }

            const data = await response.json();

            // Filter to only include LLM-extracted user profiles
            const llmProfiles = data.filter(p => {
                const profileData = p.profile || p.persona;
                return profileData && profileData.demographics;
            });

            setUserProfiles(llmProfiles);
            if (llmProfiles.length > 0) {
                setSelectedProfile(llmProfiles[0]);
            }
        } catch (err) {
            setUserProfiles([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-slate-400">Loading user profiles...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
                <div className="text-red-400 text-lg mb-2">Failed to load user profiles</div>
                <div className="text-slate-500 text-sm">{error}</div>
            </div>
        );
    }

    if (userProfiles.length === 0) {
        return (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-8 text-center">
                <div className="text-4xl mb-4">🤖</div>
                <div className="text-slate-300 text-lg mb-2">No LLM-Extracted User Profiles Yet</div>
                <div className="text-slate-500 text-sm max-w-md mx-auto">
                    Run the extraction script to generate user profiles from interview transcripts:
                    <code className="block mt-3 bg-slate-900 px-4 py-2 rounded-lg text-sky-400 text-xs">
                        python backend/scripts/extract_users.py
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
                    <h1 className="text-2xl font-bold text-white">LLM-Extracted User Profiles</h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {userProfiles.length} user profile{userProfiles.length !== 1 ? 's' : ''} extracted from interview transcripts
                    </p>
                </div>
                <div className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg text-sm font-medium">
                    ✓ {userProfiles.length} Processed
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* User Profile List */}
                <div className="col-span-4 space-y-3">
                    {userProfiles.map((p) => {
                        const profile = p.profile || p.persona;
                        const userName = profile?.title?.user_name || 'Unknown User';
                        const twoWordSummary = profile?.title?.two_word_summary || '';
                        const genderValue = profile?.demographics?.gender?.value || profile?.demographics?.gender;
                        const occupationValue = profile?.demographics?.occupation?.value || profile?.demographics?.occupation || 'Unknown Occupation';
                        const locationValue = profile?.demographics?.location?.value || profile?.demographics?.location || 'Unknown Location';

                        return (
                            <button
                                key={p.user_id}
                                onClick={() => setSelectedProfile(p)}
                                className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${selectedProfile?.user_id === p.user_id
                                    ? 'bg-sky-500/20 border border-sky-500/50'
                                    : 'bg-slate-800/50 border border-slate-700/50 hover:border-slate-600'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                        {genderValue?.[0]?.toUpperCase() || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white font-medium truncate">
                                            {twoWordSummary || occupationValue}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* User Profile Detail */}
                <div className="col-span-8">
                    {selectedProfile && (
                        <UserProfileCard userProfile={selectedProfile} />
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * TooltipWrapper - Shows confidence and evidence on hover
 */
const TooltipWrapper = ({ data, children }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    // Handle both object format { value, confidence, evidence } and simple values
    const hasTooltipData = data && typeof data === 'object' && (data.confidence || data.evidence);

    if (!hasTooltipData) {
        return <>{children}</>;
    }

    const confidencePercent = data.confidence ? (parseFloat(data.confidence) * 100).toFixed(0) : null;

    return (
        <div
            className="relative inline-block cursor-help"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <span className="border-b border-dotted border-slate-500 hover:border-sky-400 transition-colors">
                {children}
            </span>
            {showTooltip && (
                <div className="absolute z-50 bottom-full left-0 mb-2 w-72 p-3 bg-slate-900 border border-slate-600 rounded-lg shadow-xl animate-fade-in">
                    {confidencePercent && (
                        <div className="mb-2">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">Confidence</span>
                                <span className="text-sky-400 font-medium">{confidencePercent}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-sky-500 to-purple-500 rounded-full transition-all"
                                    style={{ width: `${confidencePercent}%` }}
                                />
                            </div>
                        </div>
                    )}
                    {data.evidence && (
                        <div className="text-xs">
                            <span className="text-slate-400">Evidence: </span>
                            <span className="text-slate-300 italic">"{data.evidence}"</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

/**
 * UserProfileCard - Displays detailed user profile information
 */
export const UserProfileCard = ({ userProfile }) => {
    const p = userProfile.profile || userProfile.persona;

    if (!p) return null;

    // Helper to get value from new structure or fallback to old
    const getValue = (field) => {
        if (!field) return null;
        if (typeof field === 'object' && 'value' in field) return field.value;
        return field;
    };

    const userName = p.title?.user_name || 'Unknown User';
    const twoWordSummary = p.title?.two_word_summary || '';
    const confidenceOverall = p.title?.confidence_overall;

    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
            {/* Header with Title Info */}
            <div className="bg-gradient-to-r from-sky-500/20 to-purple-500/20 p-6 border-b border-slate-700/50">
                <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                        {getValue(p.demographics?.gender)?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-white mb-1">
                            {twoWordSummary || profile?.demographics?.occupation?.value || profile?.demographics?.occupation}
                        </h2>
                        {confidenceOverall && (
                            <div className="flex flex-col gap-1 mt-2">
                                <span className="text-xs text-slate-400">Overall Confidence that the data has been interpreted correctly by the LLM:</span>
                                <div className="flex items-center gap-2">
                                    <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-500 to-sky-500 rounded-full"
                                            style={{ width: `${parseFloat(confidenceOverall) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-emerald-400 font-medium">
                                        {(parseFloat(confidenceOverall) * 100).toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Demographics */}
                <Section title="Demographics" icon="👤">
                    <div className="grid grid-cols-2 gap-4">
                        <InfoItem label="Age Range" data={p.demographics?.age_range} />
                        <InfoItem label="Gender" data={p.demographics?.gender} />
                        <InfoItem label="Nationality/Background" data={p.demographics?.nationality_background} />
                        <InfoItem label="Location" data={p.demographics?.location} />
                        <InfoItem label="Living Situation" data={p.demographics?.living_situation} />
                        <InfoItem label="Occupation" data={p.demographics?.occupation} />
                        <InfoItem label="Education" data={p.demographics?.education} />
                    </div>
                </Section>

                {/* Psychographics */}
                <Section title="Psychographics" icon="🧠">
                    <div className="space-y-4">
                        <InfoItem label="Goals & Motivations" data={p.psychographics?.goals_and_motivations} fullWidth />
                        <div className="grid grid-cols-2 gap-4">
                            <TagList label="Interests" data={p.psychographics?.interests} color="purple" />
                            <TagList label="Values" data={p.psychographics?.values} color="emerald" />
                        </div>
                    </div>
                </Section>

                {/* Shopping Behavior */}
                <Section title="Shopping Behavior" icon="🛒">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <InfoItem label="Frequency of Use of Shopping Apps/Platforms" data={p.shopping_behavior?.frequency_of_use} />
                            <InfoItem label="Search Style (search for the best product in a category or buy the first one you find)" data={p.shopping_behavior?.search_style_best_vs_first} />
                            <InfoItem label="Price Preference (the cheapest or most expensive product of a category)" data={p.shopping_behavior?.price_preference_cheapest_vs_expensive} />
                        </div>
                        <TagList label="Devices Used for Online Shopping" data={p.shopping_behavior?.where_used_devices} color="sky" />
                        <TagList label="Decision Factors for Shopping" data={p.shopping_behavior?.decision_factors} color="rose" />
                        <TagList label="Preferred Categories" data={p.shopping_behavior?.preferred_categories} color="orange" />
                        <InfoItem label="Pain Points & Challenges" data={p.shopping_behavior?.pain_points_and_or_challenges} fullWidth />
                    </div>
                </Section>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700/50">
                <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                        User ID: <span className="text-slate-400 font-mono">{userProfile.user_id}</span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                        <span className="border-b border-dotted border-slate-500">Hover</span>
                        <span>values for confidence & evidence</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * Section component for grouping user profile data
 */
export const Section = ({ title, icon, children }) => (
    <div>
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span>{icon}</span>
            {title}
        </h3>
        {children}
    </div>
);

/**
 * InfoItem component for key-value display with tooltip support
 */
export const InfoItem = ({ label, data, fullWidth = false }) => {
    // Handle both new nested structure and legacy flat values
    const getValue = () => {
        if (!data) return null;
        if (typeof data === 'object' && 'value' in data) return data.value;
        return data;
    };

    const value = getValue();
    const displayValue = value || '—';

    return (
        <div className={fullWidth ? 'col-span-2' : ''}>
            <div className="text-xs text-slate-500 mb-1">{label}</div>
            <div className="text-sm text-slate-200">
                <TooltipWrapper data={data}>
                    {displayValue}
                </TooltipWrapper>
            </div>
        </div>
    );
};

/**
 * TagList component for displaying arrays as tags with tooltip support
 */
export const TagList = ({ label, data, color = 'sky' }) => {
    // Handle both new nested structure and legacy flat arrays
    const getItems = () => {
        if (!data) return [];
        if (typeof data === 'object' && 'value' in data) {
            return Array.isArray(data.value) ? data.value : [];
        }
        return Array.isArray(data) ? data : [];
    };

    const items = getItems();
    if (items.length === 0) return null;

    const colorClasses = {
        sky: 'bg-sky-500/20 text-sky-300',
        purple: 'bg-purple-500/20 text-purple-300',
        emerald: 'bg-emerald-500/20 text-emerald-300',
        orange: 'bg-orange-500/20 text-orange-300',
        rose: 'bg-rose-500/20 text-rose-300',
    };

    const hasTooltipData = data && typeof data === 'object' && (data.confidence || data.evidence);

    return (
        <div>
            <div className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                {label}
                {hasTooltipData && (
                    <TooltipWrapper data={data}>
                        <span className="text-sky-400 cursor-help">ⓘ</span>
                    </TooltipWrapper>
                )}
            </div>
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

export default UserProfileView;
