// src/components/stats/PritePercentileComparison.jsx
import React, { useState, useEffect, useContext } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AuthContext } from '../../contexts/AuthContext';
import { calculateExpectedPercentiles } from '../../utils/priteScoreUtils';
import LoadingSpinner from '../common/LoadingSpinner';

const PritePercentileComparison = ({ scores }) => {
    const { user } = useContext(AuthContext);
    const [comparisonData, setComparisonData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(null);

    useEffect(() => {
        if (scores && scores.length > 0 && user) {
            prepareComparisonData();
        } else {
            setLoading(false);
        }
    }, [scores, user]);

    const prepareComparisonData = () => {
        try {
            setLoading(true);

            // Sort scores by year
            const sortedScores = [...scores].sort((a, b) => parseInt(b.year) - parseInt(a.year));

            // Default to most recent year if not already selected
            const mostRecentYear = sortedScores[0]?.year;
            if (!selectedYear && mostRecentYear) {
                setSelectedYear(mostRecentYear);
            }

            // Get expected percentiles based on user's PGY level
            const expectedPercentiles = calculateExpectedPercentiles(user.pgyLevel || '3');

            // Prepare data for all years
            const years = {};

            sortedScores.forEach(score => {
                const yearData = [];

                // Add overall comparison
                if (score.overallPercentile !== undefined) {
                    yearData.push({
                        category: 'Overall',
                        user: score.overallPercentile,
                        expected: expectedPercentiles.overall
                    });
                }

                // Add psychiatry comparison
                if (score.psychiatryPercentile !== undefined) {
                    yearData.push({
                        category: 'Psychiatry',
                        user: score.psychiatryPercentile,
                        expected: expectedPercentiles.psychopathology
                    });
                }

                // Add neuroscience comparison
                if (score.neurosciencePercentile !== undefined) {
                    yearData.push({
                        category: 'Neuroscience',
                        user: score.neurosciencePercentile,
                        expected: expectedPercentiles.neuroscience
                    });
                }

                // Add somatic treatments comparison
                if (score.somaPercentile !== undefined) {
                    yearData.push({
                        category: 'Somatic',
                        user: score.somaPercentile,
                        expected: expectedPercentiles.somaticTreatments
                    });
                }

                // Add growth & development comparison
                if (score.growthPercentile !== undefined) {
                    yearData.push({
                        category: 'Growth',
                        user: score.growthPercentile,
                        expected: expectedPercentiles.development
                    });
                }

                // Add sections if any
                if (score.sections && score.sections.length > 0) {
                    score.sections.forEach(section => {
                        yearData.push({
                            category: section.name,
                            user: section.percentile,
                            expected: 50 // Default expected for custom sections
                        });
                    });
                }

                // Store data for this year
                years[score.year] = yearData;
            });

            setComparisonData(years);
        } catch (error) {
            console.error('Error preparing comparison data:', error);
        } finally {
            setLoading(false);
        }
    };

    // If loading or no data
    if (loading) {
        return (
            <div className="flex justify-center items-center p-6">
                <LoadingSpinner />
            </div>
        );
    }

    if (!selectedYear || Object.keys(comparisonData).length === 0) {
        return (
            <div className="text-center p-4 border rounded-lg bg-gray-50">
                <p className="text-gray-600">No PRITE score data available for comparison.</p>
                <p className="text-sm text-gray-500 mt-2">
                    Add your PRITE scores in Settings to see how you compare.
                </p>
            </div>
        );
    }

    // Get current year's data
    const currentYearData = comparisonData[selectedYear] || [];

    // Custom tooltip for the bar chart
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border rounded shadow-md">
                    <p className="font-bold">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }}>
                            {`${entry.name}: ${entry.value}th percentile`}
                        </p>
                    ))}
                    <p className="text-xs text-gray-500 mt-1">
                        {payload[0].value > payload[1].value
                            ? 'Above expected'
                            : payload[0].value < payload[1].value
                                ? 'Below expected'
                                : 'Meeting expectations'}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="prite-percentile-comparison">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">PGY-{user.pgyLevel || '?'} Comparison</h3>

                {/* Year selector */}
                <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="p-1 border rounded-md text-sm"
                >
                    {Object.keys(comparisonData).map(year => (
                        <option key={year} value={year}>
                            {year} PRITE
                        </option>
                    ))}
                </select>
            </div>

            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={currentYearData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="user" name="Your Score" fill="#3b82f6" />
                        <Bar dataKey="expected" name="Expected Score" fill="#10b981" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-blue-50 text-sm">
                <p className="text-blue-800">
                    <span className="font-medium">About this comparison:</span> The chart shows how your PRITE scores
                    compare to the expected scores for PGY-{user.pgyLevel || '?'} residents. Expected scores are
                    derived from national averages.
                </p>
            </div>
        </div>
    );
};

export default PritePercentileComparison;