// src/components/stats/PriteScoreChart.jsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { analyzePriteScores, calculateExpectedPercentiles } from '../../utils/priteScoreUtils';

const PriteScoreChart = ({ scores, pgyLevel }) => {
    const [chartType, setChartType] = useState('line');
    const [selectedMetric, setSelectedMetric] = useState('overall');
    const [analysis, setAnalysis] = useState(null);

    // Generate analysis when scores or PGY level change
    useEffect(() => {
        if (scores && scores.length > 0) {
            const result = analyzePriteScores(scores);
            setAnalysis(result);
        }
    }, [scores, pgyLevel]);

    // If no scores or analysis, show empty state
    if (!scores || scores.length === 0 || !analysis) {
        return (
            <div className="text-center p-4 border rounded-lg bg-gray-50">
                <p className="text-gray-500">No PRITE score data available to visualize</p>
            </div>
        );
    }

    // Get expected percentiles based on PGY level
    const expectedPercentiles = calculateExpectedPercentiles(pgyLevel);

    // Create the data for the line chart
    const lineChartData = analysis.trendData;

    // Get most recent score data for radar chart
    const latestScore = scores[scores.length - 1];
    const radarData = [
        { category: 'Overall', actual: latestScore.overallPercentile, expected: expectedPercentiles.overall },
        { category: 'Psychiatry', actual: latestScore.psychiatryPercentile, expected: expectedPercentiles.psychopathology },
        { category: 'Neuroscience', actual: latestScore.neurosciencePercentile, expected: expectedPercentiles.neuroscience },
        { category: 'Somatic', actual: latestScore.somaPercentile, expected: expectedPercentiles.somaticTreatments },
        { category: 'Growth', actual: latestScore.growthPercentile, expected: expectedPercentiles.development }
    ].filter(item => item.actual !== undefined && item.actual !== null);

    // Get sections for latest score
    if (latestScore.sections && latestScore.sections.length > 0) {
        latestScore.sections.forEach(section => {
            radarData.push({
                category: section.name,
                actual: section.percentile,
                expected: 50 // Default expected for custom sections
            });
        });
    }

    // Color mapping for chart lines
    const colorMap = {
        overall: '#3b82f6', // blue
        psychiatry: '#10b981', // green
        neuroscience: '#ef4444', // red
        somatic: '#8b5cf6', // purple
        growth: '#f59e0b' // amber
    };

    // Available metrics for line chart
    const availableMetrics = Object.keys(lineChartData[0]).filter(key => key !== 'year');

    // Custom tooltip for charts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border rounded shadow-md">
                    <p className="font-bold">{`Year: ${label}`}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }}>
                            {`${entry.name}: ${entry.value}${entry.name.toLowerCase().includes('percentile') ? 'th' : ''}`}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="prite-chart">
            {/* Chart type selector */}
            <div className="flex justify-center mb-4 space-x-4">
                <button
                    onClick={() => setChartType('line')}
                    className={`px-3 py-2 rounded-md ${chartType === 'line'
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    Trend Chart
                </button>
                <button
                    onClick={() => setChartType('radar')}
                    className={`px-3 py-2 rounded-md ${chartType === 'radar'
                            ? 'bg-primary text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    Performance Radar
                </button>
            </div>

            {/* Line chart view */}
            {chartType === 'line' && (
                <div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Select Metric:</label>
                        <select
                            value={selectedMetric}
                            onChange={(e) => setSelectedMetric(e.target.value)}
                            className="w-full p-2 border rounded-md"
                        >
                            {availableMetrics.map(metric => (
                                <option key={metric} value={metric}>
                                    {metric.charAt(0).toUpperCase() + metric.slice(1).replace('Percentile', '')}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="h-64 md:h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={lineChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="year" />
                                <YAxis domain={[0, 100]} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey={selectedMetric}
                                    stroke={colorMap[selectedMetric] || '#8884d8'}
                                    activeDot={{ r: 8 }}
                                    name={selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}
                                />
                                {/* Add expected line if we're showing a core metric */}
                                {(selectedMetric === 'overall' ||
                                    selectedMetric === 'psychiatry' ||
                                    selectedMetric === 'neuroscience' ||
                                    selectedMetric === 'somatic' ||
                                    selectedMetric === 'growth') && (
                                        <Line
                                            type="dashed"
                                            dataKey="expected"
                                            stroke="#9CA3AF"
                                            strokeDasharray="5 5"
                                            name="Expected"
                                        />
                                    )}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Radar chart view */}
            {chartType === 'radar' && (
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart outerRadius={90} data={radarData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="category" />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} />
                            <Radar
                                name="Actual"
                                dataKey="actual"
                                stroke="#3b82f6"
                                fill="#3b82f6"
                                fillOpacity={0.3}
                            />
                            <Radar
                                name="Expected"
                                dataKey="expected"
                                stroke="#10b981"
                                fill="#10b981"
                                fillOpacity={0.3}
                            />
                            <Legend />
                            <Tooltip />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Analysis section */}
            <div className="mt-6">
                <h3 className="font-bold mb-2">Analysis</h3>

                {/* Improvement areas */}
                {analysis.improvementAreas.length > 0 && (
                    <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Areas of Improvement</h4>
                        <div className="space-y-2">
                            {analysis.improvementAreas.map((area, index) => (
                                <div key={index} className={`p-3 rounded-lg ${area.isRegression ? 'bg-red-50' : 'bg-green-50'}`}>
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">{area.category}</span>
                                        <span className={area.isRegression ? 'text-red-600' : 'text-green-600'}>
                                            {area.isRegression ? '↓' : '↑'} {Math.abs(area.improvement)}%
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        Current: {area.current}% {area.isRegression ? 'down from previous' : 'up from initial'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Strength areas */}
                {analysis.strengthAreas.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium mb-2">Areas of Strength</h4>
                        <div className="space-y-2">
                            {analysis.strengthAreas.map((area, index) => (
                                <div key={index} className="p-3 rounded-lg bg-blue-50">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium">{area.category}</span>
                                        <span className="text-blue-600">{area.score}%</span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {area.score >= 90 ? 'Excellent' : 'Strong'} performance
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* No improvement or strengths */}
                {!analysis.hasImprovement && analysis.strengthAreas.length === 0 && (
                    <p className="text-sm text-gray-600">
                        Add more PRITE scores from different years to see improvement analysis.
                    </p>
                )}
            </div>
        </div>
    );
};

export default PriteScoreChart;