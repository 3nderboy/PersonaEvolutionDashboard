import React, { useState } from 'react';
import { Section, TagList } from './UserProfileView';

/**
 * UserCountTooltip - Shows user count on hover for persona attributes
 */
const UserCountTooltip = ({ data, children }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    // Extract user count from any num_of_users_* field
    const userCount = data && typeof data === 'object'
        ? Object.entries(data).find(([key]) => key.startsWith('num_of_users'))?.[1]
        : null;

    if (!userCount) {
        return <>{children}</>;
    }

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
                <div className="absolute z-50 bottom-full left-0 mb-2 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg shadow-xl animate-fade-in whitespace-nowrap">
                    <div className="text-xs">
                        <span className="text-slate-400">Users: </span>
                        <span className="text-sky-400 font-medium">{userCount}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * PersonaInfoItem - Key-value display with user count tooltip
 */
const PersonaInfoItem = ({ label, data, fullWidth = false }) => {
    const value = data?.value || '—';

    return (
        <div className={fullWidth ? 'col-span-2' : ''}>
            <div className="text-xs text-slate-500 mb-1">{label}</div>
            <div className="text-sm text-slate-200">
                <UserCountTooltip data={data}>
                    {value}
                </UserCountTooltip>
            </div>
        </div>
    );
};

/**
 * HelpTooltip - Shows help text on hover with consistent styling
 */
const HelpTooltip = ({ children, tooltipText }) => {
    const [showTooltip, setShowTooltip] = useState(false);

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
                    <div className="text-xs text-slate-400">
                        {tooltipText}
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * ClusterPersonaCard - Displays LLM-generated cluster persona
 */
const ClusterPersonaCard = ({ clusterPersona, clusterColor }) => {
    if (!clusterPersona?.persona) {
        return (
            <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/30 text-center">
                <div className="text-4xl mb-3">🔮</div>
                <div className="text-slate-400">No cluster persona available for this month</div>
                <div className="text-slate-500 text-sm mt-2">
                    Run the extraction script to generate cluster personas
                </div>
            </div>
        );
    }

    const p = clusterPersona.persona;
    const title = p.title || {};
    const demographics = p.demographics || {};
    const psychographics = p.psychographics || {};
    const shopping = p.shopping_behavior || {};

    return (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-sky-500/20 to-purple-500/20 p-6 border-b border-slate-700/50">
                <div className="flex items-start gap-4">
                    <div className="flex-1">
                        <h2 className="text-xl font-bold text-white mb-1">
                            {title.persona_name || 'Unknown Persona'}
                        </h2>
                        {title.tagline && (
                            <p className="text-slate-400 text-sm italic">
                                "{title.tagline}"
                            </p>
                        )}
                        <div className="flex gap-4 mt-2 text-xs text-slate-500">
                            {/* <span>Cluster {clusterPersona.cluster_id}</span> */}
                            <HelpTooltip tooltipText="Only users with complete profiles are used to synthesize the persona.">
                                {clusterPersona.user_count} user profiles synthesized
                            </HelpTooltip>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Demographics */}
                <Section title="Demographics" icon="👤">
                    <div className="grid grid-cols-2 gap-4">
                        <PersonaInfoItem label="Age Distribution" data={demographics.age_distribution} />
                        <PersonaInfoItem label="Gender" data={demographics.gender_distribution} />
                        <PersonaInfoItem label="Nationality" data={demographics.nationality_background} />
                        <PersonaInfoItem label="Location" data={demographics.location_pattern} />
                        <PersonaInfoItem label="Living Situation" data={demographics.living_situation} />
                        <PersonaInfoItem label="Occupation" data={demographics.occupation} />
                        <PersonaInfoItem label="Education" data={demographics.education_level} />
                    </div>
                </Section>

                {/* Psychographics */}
                {(psychographics.goals?.length > 0 || psychographics.interests?.length > 0 || psychographics.values?.length > 0) && (
                    <Section title="Psychographics" icon="🧠">
                        <div className="space-y-4">
                            {psychographics.goals?.length > 0 && (
                                <div>
                                    <div className="text-xs text-slate-500 mb-1">Goals</div>
                                    <div className="text-sm text-slate-300">{psychographics.goals.join(', ')}</div>
                                </div>
                            )}
                            {(psychographics.interests?.length > 0 || psychographics.values?.length > 0) && (
                                <div className="grid grid-cols-2 gap-4">
                                    {psychographics.interests?.length > 0 && (
                                        <TagList label="Interests" data={psychographics.interests} color="purple" />
                                    )}
                                    {psychographics.values?.length > 0 && (
                                        <TagList label="Values" data={psychographics.values} color="emerald" />
                                    )}
                                </div>
                            )}
                        </div>
                    </Section>
                )}

                {/* Shopping Behavior */}
                <Section title="Shopping Behavior" icon="🛒">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <PersonaInfoItem label="Frequency" data={shopping.frequency_pattern} />
                            {shopping.preferred_devices?.length > 0 && (
                                <TagList label="Devices" data={shopping.preferred_devices} color="sky" />
                            )}
                        </div>
                        {shopping.search_style && (
                            <div>
                                <div className="text-xs text-slate-500 mb-1">Search Style</div>
                                <div className="text-sm text-slate-300">{shopping.search_style}</div>
                            </div>
                        )}
                        {shopping.price_sensitivity && (
                            <div>
                                <div className="text-xs text-slate-500 mb-1">Price Sensitivity</div>
                                <div className="text-sm text-slate-300">{shopping.price_sensitivity}</div>
                            </div>
                        )}
                        {shopping.decision_style && (
                            <div>
                                <div className="text-xs text-slate-500 mb-1">Decision Style</div>
                                <div className="text-sm text-slate-300">{shopping.decision_style}</div>
                            </div>
                        )}
                        {shopping.preferred_categories?.length > 0 && (
                            <TagList label="Preferred Categories" data={shopping.preferred_categories} color="orange" />
                        )}
                        {shopping.common_pain_points?.length > 0 && (
                            <TagList label="Pain Points" data={shopping.common_pain_points} color="rose" />
                        )}
                    </div>
                </Section>

                {/* Narrative */}
                {p.narrative && (
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                        <div className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Persona Narrative</div>
                        <p className="text-sm text-slate-300 leading-relaxed">{p.narrative}</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700/50">
                <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                        Generated: <span className="text-slate-400">{new Date(clusterPersona.generated_at).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                        <span className="border-b border-dotted border-slate-500">Hover</span>
                        <span>values for user counts</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClusterPersonaCard;
