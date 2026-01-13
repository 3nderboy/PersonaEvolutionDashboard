import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

const PersonaRadarChart = ({ metrics, data, color = "#0ea5e9", width, height, className }) => {
    // Handle "data" prop (array of users) fallback
    const effectiveMetrics = metrics || (data && data[0] ? data[0].behavioral_metrics : null);

    if (!effectiveMetrics) return null;

    const chartData = [
        { subject: 'Decisiveness', A: effectiveMetrics.decisiveness || 0 },
        { subject: 'Exploration', A: effectiveMetrics.exploration || 0 },
        { subject: 'Research', A: effectiveMetrics.research_depth || 0 },
        { subject: 'Price Sens.', A: effectiveMetrics.price_sensitivity || 0 },
        { subject: 'Engagement', A: effectiveMetrics.engagement || 0 },
    ];

    return (
        <div
            className={className || "w-full h-full min-h-[250px]"}
            style={width && height ? { width, height } : {}}
        >
            <ResponsiveContainer width={width || "100%"} height={height || "100%"}>
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                    />
                    <PolarRadiusAxis
                        angle={30}
                        domain={[0, 1]}
                        tick={false}
                        axisLine={false}
                    />
                    <Radar
                        name="Persona"
                        dataKey="A"
                        stroke={color}
                        fill={color}
                        fillOpacity={0.3}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1e293b',
                            borderColor: '#334155',
                            color: '#e2e8f0',
                            fontSize: '12px'
                        }}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PersonaRadarChart;
