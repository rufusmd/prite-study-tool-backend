// src/components/stats/PriteDashboard.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import PriteScoreChart from './PriteScoreChart';
import PritePercentileComparison from './PritePercentileComparison';
import PriteRecommendations from './PriteRecommendations';
import LoadingSpinner from '../common/LoadingSpinner';
import api from '../../utils/api';

const PriteDashboard = () => {
    const { user } = useContext(AuthContext);
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    // Fetch PRITE scores when component mounts
    useEffect(() => {
        fetchPriteScores();
    }, []);

    const fetchPriteScores = async () => {
        try {
            setLoading(true);

            // Fetch scores from API
            const response = await api.get('/users/prite-scores');

            if (response.data && response.data.success) {
                setScores(response.data.scores || []);
            } else {
                // For demo purposes, you might want to use some mock data if API fails
                setScores(getMockScores());
            }
        } catch (error) {
            console.error('Error fetching PRITE scores:', error);
            setError('Failed to load PRITE scores. Please try again later.');

            // For demo purposes, use mock data on error
            setScores(getMockScores());
        } finally {
            setLoading(false);
        }
    };

    // Mock data for demo purposes
    const getMockScores = () => {
        const currentYear = new Date().getFullYear();

        return [
            {
                _id: '1',
                year: (currentYear - 2).toString(),
                overallPercentile: 45,
                psychiatryPercentile: 50,
                neurosciencePercentile: 40,
                somaPercentile: 42,
                growthPercentile: 48,
                userId: user?._id
            },
            {
                _id: '2',
                year: (currentYear - 1).toString(),
                overallPercentile: 62,
                psychiatryPercentile: 68,
                neurosciencePercentile: 55,
                somaPercentile: 60,
                growthPercentile: 65,
                sections: [
                    { name: 'Forensics', percentile: 70 },
                    { name: 'Ethics', percentile: 75 }
                ],
                userId: user?._id
            },
            {
                _id: '3',
                year: currentYear.toString(),
                overallPercentile: 75,
                psychiatryPercentile: 80,
                neurosciencePercentile: 68,
                somaPercentile: 72,
                growthPercentile: 78,
                sections: [
                    { name: 'Forensics', percentile: 85 },
                    { name: 'Ethics', percentile: 82 },
                    { name: 'Research', percentile: 70 }
                ],
                userId: user?._id
            }
        ];
    };

    // Show loading state
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <LoadingSpinner size="large" />
                <p className="mt-4 text-gray-600">Loading PRITE scores...</p>
            </div>
        );
    }

    // Show empty state if no scores
    if (scores.length === 0) {
        return (
            <div className="text-center py-12 border rounded-lg bg-gray-50">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No PRITE scores available</h3>
                <p className="mt-1 text-gray-500">
                    Add your PRITE exam scores to see insights and track your progress over time.
                </p>
                <div className="mt-6">
                    <button
                        onClick={() => window.location.href = '/settings?tab=prite-scores'}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                        Add PRITE Scores
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="prite-dashboard">
            {/* Tab navigation */}
            <div className="border-b mb-6">
                <nav className="flex -mb-px">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`mr-8 py-4 px-1 ${activeTab === 'overview'
                                ? 'border-b-2 border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('comparison')}
                        className={`mr-8 py-4 px-1 ${activeTab === 'comparison'
                                ? 'border-b-2 border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Comparison
                    </button>
                    <button
                        onClick={() => setActiveTab('recommendations')}
                        className={`py-4 px-1 ${activeTab === 'recommendations'
                                ? 'border-b-2 border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Recommendations
                    </button>
                </nav>
            </div>

            {/* Tab content */}
            <div className="tab-content">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div>
                        <div className="card p-4 mb-6">
                            <h3 className="font-bold text-lg mb-4">PRITE Score Trends</h3>
                            <PriteScoreChart scores={scores} pgyLevel={user?.pgyLevel || '3'} />
                        </div>

                        {/* Summary cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            {/* Most recent score */}
                            <div className="card p-4">
                                <h4 className="font-medium text-gray-700 mb-2">Latest Overall Percentile</h4>
                                <div className="flex items-end">
                                    <div className="text-3xl font-bold text-primary">
                                        {scores[scores.length - 1].overallPercentile}%
                                    </div>
                                    {scores.length > 1 && (
                                        <div className={`ml-2 text-sm ${scores[scores.length - 1].overallPercentile > scores[scores.length - 2].overallPercentile
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                            }`}>
                                            {scores[scores.length - 1].overallPercentile > scores[scores.length - 2].overallPercentile
                                                ? '↑ '
                                                : '↓ '}
                                            {Math.abs(scores[scores.length - 1].overallPercentile - scores[scores.length - 2].overallPercentile)}%
                                        </div>
                                    )}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">
                                    PRITE {scores[scores.length - 1].year}
                                </div>
                            </div>

                            {/* Highest scoring area */}
                            <div className="card p-4">
                                <h4 className="font-medium text-gray-700 mb-2">Strongest Area</h4>
                                {(() => {
                                    const latestScore = scores[scores.length - 1];
                                    const scores_array = [
                                        { name: 'Psychiatry', score: latestScore.psychiatryPercentile },
                                        { name: 'Neuroscience', score: latestScore.neurosciencePercentile },
                                        { name: 'Somatic', score: latestScore.somaPercentile },
                                        { name: 'Growth', score: latestScore.growthPercentile }
                                    ].filter(s => s.score !== undefined);

                                    scores_array.sort((a, b) => b.score - a.score);
                                    const highest = scores_array[0];

                                    return (
                                        <>
                                            <div className="text-3xl font-bold text-success">{highest?.score || 0}%</div>
                                            <div className="text-sm text-gray-500 mt-1">{highest?.name || 'N/A'}</div>
                                        </>
                                    );
                                })()}
                            </div>

                            {/* Area to improve */}
                            <div className="card p-4">
                                <h4 className="font-medium text-gray-700 mb-2">Area to Improve</h4>
                                {(() => {
                                    const latestScore = scores[scores.length - 1];
                                    const scores_array = [
                                        { name: 'Psychiatry', score: latestScore.psychiatryPercentile },
                                        { name: 'Neuroscience', score: latestScore.neurosciencePercentile },
                                        { name: 'Somatic', score: latestScore.somaPercentile },
                                        { name: 'Growth', score: latestScore.growthPercentile }
                                    ].filter(s => s.score !== undefined);

                                    scores_array.sort((a, b) => a.score - b.score);
                                    const lowest = scores_array[0];

                                    return (
                                        <>
                                            <div className="text-3xl font-bold text-warning">{lowest?.score || 0}%</div>
                                            <div className="text-sm text-gray-500 mt-1">{lowest?.name || 'N/A'}</div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Year-over-year comparison */}
                        {scores.length > 1 && (
                            <div className="card p-4">
                                <h3 className="font-bold text-lg mb-4">Year-over-Year Progress</h3>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr className="bg-gray-50">
                                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Category</th>
                                                {scores.map((score, index) => (
                                                    <th key={index} className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                                                        {score.year}
                                                    </th>
                                                ))}
                                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                                                    Change
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            <tr>
                                                <td className="px-4 py-3 text-sm text-gray-900 font-medium">Overall</td>
                                                {scores.map((score, index) => (
                                                    <td key={index} className="px-4 py-3 text-sm text-gray-900">
                                                        {score.overallPercentile}%
                                                    </td>
                                                ))}
                                                <td className={`px-4 py-3 text-sm font-medium ${scores[scores.length - 1].overallPercentile > scores[0].overallPercentile
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                    }`}>
                                                    {scores[scores.length - 1].overallPercentile > scores[0].overallPercentile ? '+' : ''}
                                                    {scores[scores.length - 1].overallPercentile - scores[0].overallPercentile}%
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 text-sm text-gray-900 font-medium">Psychiatry</td>
                                                {scores.map((score, index) => (
                                                    <td key={index} className="px-4 py-3 text-sm text-gray-900">
                                                        {score.psychiatryPercentile ?? 'N/A'}%
                                                    </td>
                                                ))}
                                                <td className={`px-4 py-3 text-sm font-medium ${scores[scores.length - 1].psychiatryPercentile > scores[0].psychiatryPercentile
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                    }`}>
                                                    {scores[scores.length - 1].psychiatryPercentile && scores[0].psychiatryPercentile ? (
                                                        <>
                                                            {scores[scores.length - 1].psychiatryPercentile > scores[0].psychiatryPercentile ? '+' : ''}
                                                            {scores[scores.length - 1].psychiatryPercentile - scores[0].psychiatryPercentile}%
                                                        </>
                                                    ) : 'N/A'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 text-sm text-gray-900 font-medium">Neuroscience</td>
                                                {scores.map((score, index) => (
                                                    <td key={index} className="px-4 py-3 text-sm text-gray-900">
                                                        {score.neurosciencePercentile ?? 'N/A'}%
                                                    </td>
                                                ))}
                                                <td className={`px-4 py-3 text-sm font-medium ${scores[scores.length - 1].neurosciencePercentile > scores[0].neurosciencePercentile
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                    }`}>
                                                    {scores[scores.length - 1].neurosciencePercentile && scores[0].neurosciencePercentile ? (
                                                        <>
                                                            {scores[scores.length - 1].neurosciencePercentile > scores[0].neurosciencePercentile ? '+' : ''}
                                                            {scores[scores.length - 1].neurosciencePercentile - scores[0].neurosciencePercentile}%
                                                        </>
                                                    ) : 'N/A'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 text-sm text-gray-900 font-medium">Somatic</td>
                                                {scores.map((score, index) => (
                                                    <td key={index} className="px-4 py-3 text-sm text-gray-900">
                                                        {score.somaPercentile ?? 'N/A'}%
                                                    </td>
                                                ))}
                                                <td className={`px-4 py-3 text-sm font-medium ${scores[scores.length - 1].somaPercentile > scores[0].somaPercentile
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                    }`}>
                                                    {scores[scores.length - 1].somaPercentile && scores[0].somaPercentile ? (
                                                        <>
                                                            {scores[scores.length - 1].somaPercentile > scores[0].somaPercentile ? '+' : ''}
                                                            {scores[scores.length - 1].somaPercentile - scores[0].somaPercentile}%
                                                        </>
                                                    ) : 'N/A'}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 text-sm text-gray-900 font-medium">Growth</td>
                                                {scores.map((score, index) => (
                                                    <td key={index} className="px-4 py-3 text-sm text-gray-900">
                                                        {score.growthPercentile ?? 'N/A'}%
                                                    </td>
                                                ))}
                                                <td className={`px-4 py-3 text-sm font-medium ${scores[scores.length - 1].growthPercentile > scores[0].growthPercentile
                                                        ? 'text-green-600'
                                                        : 'text-red-600'
                                                    }`}>
                                                    {scores[scores.length - 1].growthPercentile && scores[0].growthPercentile ? (
                                                        <>
                                                            {scores[scores.length - 1].growthPercentile > scores[0].growthPercentile ? '+' : ''}
                                                            {scores[scores.length - 1].growthPercentile - scores[0].growthPercentile}%
                                                        </>
                                                    ) : 'N/A'}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Comparison Tab */}
                {activeTab === 'comparison' && (
                    <div>
                        <div className="card p-4 mb-6">
                            <h3 className="font-bold text-lg mb-4">PRITE Score Comparison</h3>
                            <PritePercentileComparison scores={scores} />
                        </div>

                        <div className="card p-4">
                            <h3 className="font-bold text-lg mb-4">Specialty Comparison</h3>
                            <p className="text-gray-600 mb-2">
                                See how your scores compare to others in your specialty and training level.
                            </p>

                            <div className="p-6 text-center">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h3 className="mt-2 text-lg font-medium text-gray-900">Coming Soon</h3>
                                <p className="mt-1 text-gray-500">
                                    This feature will be available in a future update.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recommendations Tab */}
                {activeTab === 'recommendations' && (
                    <div>
                        <div className="card p-4 mb-6">
                            <PriteRecommendations scores={scores} />
                        </div>

                        <div className="card p-4">
                            <h3 className="font-bold text-lg mb-4">Targeted Study Plan</h3>

                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm leading-5 font-medium text-yellow-800">
                                            Personalized Study Plan
                                        </h3>
                                        <div className="mt-2 text-sm leading-5 text-yellow-700">
                                            <p>
                                                Based on your PRITE scores, we recommend focusing on the following areas to improve your performance.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {(() => {
                                    const latestScore = scores[scores.length - 1];
                                    const categories = [
                                        { name: 'Psychiatry', score: latestScore.psychiatryPercentile },
                                        { name: 'Neuroscience', score: latestScore.neurosciencePercentile },
                                        { name: 'Somatic', score: latestScore.somaPercentile },
                                        { name: 'Growth', score: latestScore.growthPercentile }
                                    ].filter(c => c.score !== undefined);

                                    // Sort by score ascending (lowest first)
                                    categories.sort((a, b) => a.score - b.score);

                                    // Take the lowest 2 categories
                                    return categories.slice(0, 2).map((category, index) => (
                                        <div key={index} className="p-4 border rounded-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="font-medium">{category.name}</h4>
                                                <span className="text-sm text-gray-600">{category.score}%</span>
                                            </div>

                                            <p className="text-sm text-gray-600 mb-3">
                                                Increase your {category.name} scores by focusing on high-yield topics and practice questions.
                                            </p>

                                            <button
                                                className="w-full py-2 bg-primary text-white rounded-md text-sm"
                                                onClick={() => {
                                                    window.location.href = `/study?category=${encodeURIComponent(category.name)}`;
                                                }}
                                            >
                                                Study {category.name} Questions
                                            </button>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PriteDashboard;