import React from 'react';

const DocumentationView = () => {
    return (
        <div className="flex h-full">
            <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto">
                <h1 className="text-3xl font-bold text-white mb-8">Persona Evolution Dashboard Documentation</h1>

                <div className="space-y-10">
                    {/* Overview */}
                    <section className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                            <span>🎯</span> Dashboard Overview
                        </h2>
                        <p className="text-slate-300 leading-relaxed mb-4">
                            The Persona Evolution Dashboard helps you understand how user shopping behaviors change over time by analyzing sessions from the OPeRA dataset.
                        </p>
                        <ul className="space-y-2text-slate-300">
                            <li className="flex items-start gap-2">
                                <span className="text-sky-400 mt-1">•</span>
                                <span><strong>437 sessions</strong> analyzed from the OPeRA dataset</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-sky-400 mt-1">•</span>
                                <span><strong>5 behavioral clusters</strong> identified using K-means</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-sky-400 mt-1">•</span>
                                <span><strong>3 time periods</strong> for tracking evolution</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-sky-400 mt-1">•</span>
                                <span><strong>10 behavioral metrics</strong> capturing shopping patterns</span>
                            </li>
                        </ul>
                    </section>

                    {/* How to Use */}
                    <section className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                            <span>📖</span> How to Use the Dashboard
                        </h2>
                        <div className="space-y-4">
                            <div className="bg-slate-900/50 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold text-sky-400 mb-2">1. Select a Time Period</h3>
                                <p className="text-slate-300 text-sm">Choose a month from the dropdown menu at the top of the Clusters view.</p>
                            </div>
                            <div className="bg-slate-900/50 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold text-sky-400 mb-2">2. Explore Cluster Distribution</h3>
                                <p className="text-slate-300 text-sm">Click cluster centroids in the scatter plot to view detailed persona information.</p>
                            </div>
                            <div className="bg-slate-900/50 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold text-sky-400 mb-2">3. Analyze Personas</h3>
                                <p className="text-slate-300 text-sm">View distinguishing traits, behavioral profiles, and z-score analysis for each cluster.</p>
                            </div>
                        </div>
                    </section>

                    {/* Core Concepts */}
                    <section className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                            <span>💡</span> Core Concepts
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-3">Behavioral Key Metrics (BKMs)</h3>
                                <p className="text-slate-300 leading-relaxed mb-4">
                                    We selected 10 quantitative measures that capture different aspects of shopping behavior.
                                    These metrics were chosen because they represent distinct behavioral patterns (engagement, intent, and decision-making)
                                    and can be reliably extracted from session data.
                                </p>

                                {/* Engagement Metrics */}
                                <div className="bg-slate-900/50 rounded-lg p-5 mb-4">
                                    <h4 className="text-lg font-semibold text-sky-400 mb-3">Engagement Metrics</h4>
                                    <p className="text-sm text-slate-400 mb-4">Measure how long and how intensely users interact with the platform</p>

                                    <div className="space-y-4">
                                        <div className="border-l-2 border-sky-500/50 pl-4">
                                            <div className="font-semibold text-white mb-1">Session Duration (seconds)</div>
                                            <div className="text-sm text-slate-300 mb-2">
                                                Total time commitment from start to end of session. Longer sessions may indicate
                                                thorough browsing or difficulty finding products.
                                            </div>
                                            <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded inline-block">
                                                <code>end_timestamp - start_timestamp</code>
                                            </div>
                                        </div>

                                        <div className="border-l-2 border-sky-500/50 pl-4">
                                            <div className="font-semibold text-white mb-1">Action Density</div>
                                            <div className="text-sm text-slate-300 mb-2">
                                                Actions per second during the session. Higher density indicates focused, rapid interaction;
                                                lower density suggests careful deliberation or distraction.
                                            </div>
                                            <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded inline-block">
                                                <code>total_actions / session_duration</code>
                                            </div>
                                        </div>

                                        <div className="border-l-2 border-sky-500/50 pl-4">
                                            <div className="font-semibold text-white mb-1">Total Action Count</div>
                                            <div className="text-sm text-slate-300 mb-2">
                                                Total number of actions taken in the session. Indicates overall engagement level
                                                and interaction breadth.
                                            </div>
                                            <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded inline-block">
                                                <code>count(all_actions)</code>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Shopping Intent Metrics */}
                                <div className="bg-slate-900/50 rounded-lg p-5 mb-4">
                                    <h4 className="text-lg font-semibold text-sky-400 mb-3">Shopping Intent Metrics</h4>
                                    <p className="text-sm text-slate-400 mb-4">Reveal what users are trying to accomplish during their session</p>

                                    <div className="space-y-4">
                                        <div className="border-l-2 border-sky-500/50 pl-4">
                                            <div className="font-semibold text-white mb-1">Purchase Intent Ratio</div>
                                            <div className="text-sm text-slate-300 mb-2">
                                                Proportion of purchase-related actions (add to cart, checkout, buy).
                                                High values indicate strong buying motivation; low values suggest browsing or research.
                                            </div>
                                            <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded inline-block">
                                                <code>purchase_actions / total_actions</code>
                                            </div>
                                        </div>

                                        <div className="border-l-2 border-sky-500/50 pl-4">
                                            <div className="font-semibold text-white mb-1">Search Ratio</div>
                                            <div className="text-sm text-slate-300 mb-2">
                                                Proportion of search actions. High search ratio indicates goal-directed shopping
                                                where users know what they want; low ratio suggests exploratory browsing.
                                            </div>
                                            <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded inline-block">
                                                <code>search_actions / total_actions</code>
                                            </div>
                                        </div>

                                        <div className="border-l-2 border-sky-500/50 pl-4">
                                            <div className="font-semibold text-white mb-1">Product Exploration Ratio</div>
                                            <div className="text-sm text-slate-300 mb-2">
                                                Proportion of product link clicks (browsing depth). Measures how thoroughly users
                                                explore the product catalog versus staying on listing pages.
                                            </div>
                                            <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded inline-block">
                                                <code>product_link_clicks / total_actions</code>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Decision-Making Metrics */}
                                <div className="bg-slate-900/50 rounded-lg p-5 mb-4">
                                    <h4 className="text-lg font-semibold text-sky-400 mb-3">Decision-Making Metrics</h4>
                                    <p className="text-sm text-slate-400 mb-4">Show how users gather information and make purchasing decisions</p>

                                    <div className="space-y-4">
                                        <div className="border-l-2 border-sky-500/50 pl-4">
                                            <div className="font-semibold text-white mb-1">Review Engagement Ratio</div>
                                            <div className="text-sm text-slate-300 mb-2">
                                                Proportion of review-related actions (reading reviews, filtering by rating).
                                                High engagement suggests careful evaluation and information-seeking behavior.
                                            </div>
                                            <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded inline-block">
                                                <code>review_actions / total_actions</code>
                                            </div>
                                        </div>

                                        <div className="border-l-2 border-sky-500/50 pl-4">
                                            <div className="font-semibold text-white mb-1">Filter Usage Ratio</div>
                                            <div className="text-sm text-slate-300 mb-2">
                                                Proportion of filter actions (price, brand, category filters). Indicates criteria-driven,
                                                systematic shopping approach versus casual browsing.
                                            </div>
                                            <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded inline-block">
                                                <code>filter_actions / total_actions</code>
                                            </div>
                                        </div>

                                        <div className="border-l-2 border-sky-500/50 pl-4">
                                            <div className="font-semibold text-white mb-1">Option Selection Ratio</div>
                                            <div className="text-sm text-slate-300 mb-2">
                                                Proportion of product option and quantity selections. Shows engagement with product
                                                configuration, indicating serious purchase consideration.
                                            </div>
                                            <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded inline-block">
                                                <code>(option_actions + quantity_actions) / total_actions</code>
                                            </div>
                                        </div>

                                        <div className="border-l-2 border-sky-500/50 pl-4">
                                            <div className="font-semibold text-white mb-1">Input Ratio</div>
                                            <div className="text-sm text-slate-300 mb-2">
                                                Proportion of text input actions (search queries, form fields). Higher input suggests
                                                active information seeking and specific needs.
                                            </div>
                                            <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded inline-block">
                                                <code>input_actions / total_actions</code>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <span className="text-xl">ℹ️</span>
                                        <div className="text-sm text-slate-300">
                                            <div className="font-semibold text-sky-300 mb-1">Why These Metrics?</div>
                                            These 10 metrics were selected because they: (1) capture distinct behavioral dimensions,
                                            (2) can be reliably calculated from session logs, (3) have interpretable business meaning,
                                            and (4) together provide a comprehensive behavioral fingerprint for clustering.
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-2">Clusters</h3>
                                <p className="text-slate-300 leading-relaxed">
                                    Groups of sessions with similar behavioral patterns identified using <strong>K-means clustering</strong> on normalized BKM vectors.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-2">Personas vs User Profiles</h3>
                                <div className="grid md:grid-cols-2 gap-4 mt-3">
                                    <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg p-4">
                                        <div className="font-sem ibold text-sky-300 mb-2">Cluster Personas</div>
                                        <ul className="text-sm text-slate-300 space-y-1">
                                            <li>• Cluster-level aggregation</li>
                                            <li>• Synthesized by LLM</li>
                                            <li>• One per cluster</li>
                                        </ul>
                                    </div>
                                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                                        <div className="font-semibold text-purple-300 mb-2">User Profiles</div>
                                        <ul className="text-sm text-slate-300 space-y-1">
                                            <li>• Individual user level</li>
                                            <li>• Generated by LLM per user</li>
                                            <li>• Multiple per cluster</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Statistical Concepts */}
                    <section className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                            <span>📈</span> Statistical Concepts
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-2">Z-Score (Standard Score)</h3>
                                <p className="text-slate-300 leading-relaxed mb-3">
                                    Measures how many standard deviations a value is from the mean. It indicates whether a cluster's metric is above or below average.
                                </p>
                                <div className="bg-slate-900/50 p-4 rounded-lg mb-3">
                                    <div className="font-semibold text-sky-400 mb-2">Formula</div>
                                    <code className="text-slate-300">z = (x - μ) / σ</code>
                                    <div className="text-sm text-slate-400 mt-2">
                                        where: x = cluster value, μ = population mean, σ = population standard deviation
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-500/20 text-green-300 px-3 py-1 rounded font-mono">z &gt; 0.75</div>
                                        <span className="text-slate-300">Significantly above average</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-slate-700 text-slate-300 px-3 py-1 rounded font-mono">-0.75 &lt; z &lt; 0.75</div>
                                        <span className="text-slate-300">Near average</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="bg-red-500/20 text-red-300 px-3 py-1 rounded font-mono">z &lt; -0.75</div>
                                        <span className="text-slate-300">Significantly below average</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-2">Sigma Symbol (σ)</h3>
                                <p className="text-slate-300 leading-relaxed">
                                    The Greek letter <strong className="text-sky-400">σ</strong> (sigma) represents <strong>standard deviation</strong> in statistics.
                                    It measures the spread of data around the mean.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-2">Distinguishing Traits</h3>
                                <p className="text-slate-300 leading-relaxed mb-3">
                                    Behavioral metrics where a cluster deviates significantly from theerage (|z| &gt; 0.75σ).
                                    The top 2 traits are always shown, even if below the threshold.
                                </p>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                                        <div className="font-semibold text-green-300 mb-2">High Traits (z &gt; 0.75σ)</div>
                                        <div className="text-sm text-slate-300">
                                            Metrics significantly above average, shown as green badges with ↑ symbol.
                                        </div>
                                    </div>
                                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                                        <div className="font-semibold text-red-300 mb-2">Low Traits (z &lt; -0.75σ)</div>
                                        <div className="text-sm text-slate-300">
                                            Metrics significantly below average, shown as red badges with ↓ symbol.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Visualizations */}
                    <section className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50">
                        <h2 className="text-2xl font-semibold text-white mb-4 flex items-center gap-3">
                            <span>📉</span> Visualizations
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-2">Cluster Distribution (Scatter Plot)</h3>
                                <p className="text-slate-300 leading-relaxed">
                                    Shows clusters in 2D space using <strong>PCA (Principal Component Analysis)</strong>,
                                    which reduces the 10-dimensional BKM space to 2 dimensions while preserving variance.
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-2">Behavioral Profile (Radar Chart)</h3>
                                <p className="text-slate-300 leading-relaxed">
                                    Displays all 10 normalized BKMs for a cluster in a circular format.
                                    Values range from 0 (center) to 1 (edge).
                                </p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-2">Deviation from Average (Bar Chart)</h3>
                                <p className="text-slate-300 leading-relaxed mb-3">
                                    Shows how each metric deviates from the population average using z-scores.
                                </p>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-16 h-8 bg-green-500/30 rounded border border-green-500/50"></div>
                                        <span className="text-sm text-slate-300">Green bars = Above average</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-16 h-8 bg-slate-700 rounded border border-slate-600"></div>
                                        <span className="text-sm text-slate-300">Gray bars = Near average</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-16 h-8 bg-red-500/30 rounded border border-red-500/50"></div>
                                        <span className="text-sm text-slate-300">Red bars = Below average</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default DocumentationView;
