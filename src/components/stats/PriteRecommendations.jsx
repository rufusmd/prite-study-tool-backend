// src/components/stats/PriteRecommendations.jsx
import React, { useState, useEffect } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { QuestionContext } from '../../contexts/QuestionContext';
import { analyzePriteScores, generateRecommendations } from '../../utils/priteScoreUtils';
import LoadingSpinner from '../common/LoadingSpinner';
import api from '../../utils/api';

const PriteRecommendations = ({ scores }) => {
    const { user } = useContext(AuthContext);
    const { getCategoryQuestionCount } = useContext(QuestionContext);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showingDetails, setShowingDetails] = useState(null);

    useEffect(() => {
        if (scores && scores.length > 0 && user) {
            generateRecommendationsForUser();
        } else {
            setLoading(false);
        }
    }, [scores, user]);

    const generateRecommendationsForUser = async () => {
        try {
            setLoading(true);

            // Analyze PRITE scores
            const analysis = analyzePriteScores(scores);

            // Generate recommendations based on analysis and PGY level
            const recommendationsList = generateRecommendations(analysis, user.pgyLevel || '3');

            // For each recommendation, get the question count for that category
            const enhancedRecommendations = await Promise.all(
                recommendationsList.map(async (rec) => {
                    const count = await getCategoryQuestionCount(rec.category);
                    return {
                        ...rec,
                        questionCount: count
                    };
                })
            );

            setRecommendations(enhancedRecommendations);
        } catch (error) {
            console.error('Error generating recommendations:', error);
        } finally {
            setLoading(false);
        }
    };

    // If no scores or loading, show loading state
    if (loading) {
        return (
            <div className="flex justify-center items-center p-6">
                <LoadingSpinner />
            </div>
        );
    }

    // If no recommendations, show empty state
    if (recommendations.length === 0) {
        return (
            <div className="text-center p-4 border rounded-lg bg-gray-50">
                <p className="text-gray-600">No study recommendations available yet.</p>
                <p className="text-sm text-gray-500 mt-2">
                    Add your PRITE scores to get personalized study recommendations.
                </p>
            </div>
        );
    }

    // Priority badge styling
    const priorityBadge = (priority) => {
        switch (priority) {
            case 'high':
                return (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                        High Priority
                    </span>
                );
            case 'medium':
                return (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Medium Priority
                    </span>
                );
            case 'low':
                return (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Low Priority
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <div className="prite-recommendations">
            <h3 className="font-bold text-lg mb-4">Study Recommendations</h3>

            <div className="space-y-4">
                {recommendations.map((rec, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${rec.priority === 'high'
                            ? 'border-red-200 bg-red-50'
                            : rec.priority === 'medium'
                                ? 'border-yellow-200 bg-yellow-50'
                                : 'border-green-200 bg-green-50'
                        }`}>
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{rec.category}</h4>
                            {priorityBadge(rec.priority)}
                        </div>

                        <p className="text-gray-700 mb-3">{rec.message}</p>

                        {/* Database info */}
                        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <span>
                                {rec.questionCount} questions available in {rec.category}
                            </span>
                        </div>

                        {/* Toggle detailed resources */}
                        <button
                            onClick={() => setShowingDetails(showingDetails === index ? null : index)}
                            className="text-primary text-sm font-medium flex items-center"
                        >
                            {showingDetails === index ? 'Hide Resources' : 'Show Recommended Resources'}
                            <svg
                                className={`h-4 w-4 ml-1 transform transition-transform ${showingDetails === index ? 'rotate-180' : ''
                                    }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Resource details */}
                        {showingDetails === index && (
                            <div className="mt-3 p-3 bg-white rounded-md">
                                <h5 className="font-medium text-sm mb-2">Recommended Resources:</h5>
                                <ul className="space-y-1 text-sm">
                                    {rec.suggestedResources.map((resource, i) => (
                                        <li key={i} className="flex items-start">
                                            <span className="text-gray-500 mr-2">•</span>
                                            <span>{resource}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    className="mt-3 w-full py-1 px-3 bg-primary/10 text-primary text-sm rounded-md"
                                    onClick={() => {
                                        // This would navigate to the appropriate study section
                                        window.location.href = `/study?category=${encodeURIComponent(rec.category)}`;
                                    }}
                                >
                                    Study {rec.category} Questions
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PriteRecommendations;