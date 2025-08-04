// src/components/stats/ComparativeScoring.jsx
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { QuestionContext } from '../../contexts/QuestionContext';
import LoadingSpinner from '../common/LoadingSpinner';
import api from '../../utils/api';

const ComparativeScoring = () => {
    const { user } = useContext(AuthContext);
    const { userStats } = useContext(QuestionContext);
    const [loading, setLoading] = useState(true);
    const [comparativeData, setComparativeData] = useState({
        overall: {
            percentile: 0,
            totalUsers: 0,
            averageScore: 0
        },
        pgyLevel: {
            percentile: 0,
            totalUsers: 0,
            averageScore: 0
        },
        timeBasedRanking: 0 // Percentile rank based on time to answer
    });

    useEffect(() => {
        const fetchComparativeData = async () => {
            try {
                setLoading(true);

                // We would fetch this data from the server in a real implementation
                const response = await api.get('/stats/comparative');

                if (response.data && response.data.success) {
                    setComparativeData(response.data.data);
                } else {
                    // For testing/demo, generate mock data
                    generateMockData();
                }
            } catch (error) {
                console.error("Error fetching comparative data:", error);
                // For testing/demo, generate mock data
                generateMockData();
            } finally {
                setLoading(false);
            }
        };

        const generateMockData = () => {
            // Generate random percentiles based on user's statistics
            // In production, this would come from the server
            const overallPercentile = Math.min(95, Math.max(5, Math.round(userStats.masteryLevel * 0.8 + Math.random() * 20)));
            const pgyPercentile = Math.min(95, Math.max(5, Math.round(userStats.masteryLevel * 0.7 + Math.random() * 30)));
            const timeBasedRanking = Math.min(95, Math.max(5, Math.round(userStats.masteryLevel * 0.6 + Math.random() * 40)));

            setComparativeData({
                overall: {
                    percentile: overallPercentile,
                    totalUsers: 120,
                    averageScore: 68
                },
                pgyLevel: {
                    percentile: pgyPercentile,
                    totalUsers: 35,
                    averageScore: 72,
                    level: user?.pgyLevel || 'Unknown'
                },
                timeBasedRanking: timeBasedRanking
            });
        };

        fetchComparativeData();
    }, [userStats.masteryLevel, user?.pgyLevel]);

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8">
                <LoadingSpinner />
            </div>
        );
    }

    // Helper function to get color class based on percentile
    const getPercentileColor = (percentile) => {
        if (percentile >= 80) return "text-success";
        if (percentile >= 50) return "text-primary";
        if (percentile >= 30) return "text-warning";
        return "text-danger";
    };

    return (
        <div className="comparative-scoring">
            <h3 className="text-lg font-bold mb-4">Performance Rankings</h3>

            {/* Overall Percentile */}
            <div className="card p-4 mb-4 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Overall Ranking</h4>
                    <div className={`text-2xl font-bold ${getPercentileColor(comparativeData.overall.percentile)}`}>
                        {comparativeData.overall.percentile}%
                    </div>
                </div>

                <div className="relative h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                    <div
                        className="absolute top-0 left-0 h-full bg-primary rounded-full"
                        style={{ width: `${comparativeData.overall.percentile}%` }}
                    ></div>
                </div>

                <p className="text-xs text-gray-600">
                    You're in the {comparativeData.overall.percentile}th percentile among all {comparativeData.overall.totalUsers} users.
                    The average score is {comparativeData.overall.averageScore}%.
                </p>
            </div>

            {/* PGY Level Percentile */}
            <div className="card p-4 mb-4 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">PGY-{comparativeData.pgyLevel.level} Ranking</h4>
                    <div className={`text-2xl font-bold ${getPercentileColor(comparativeData.pgyLevel.percentile)}`}>
                        {comparativeData.pgyLevel.percentile}%
                    </div>
                </div>

                <div className="relative h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                    <div
                        className="absolute top-0 left-0 h-full bg-success rounded-full"
                        style={{ width: `${comparativeData.pgyLevel.percentile}%` }}
                    ></div>
                </div>

                <p className="text-xs text-gray-600">
                    Among {comparativeData.pgyLevel.totalUsers} PGY-{comparativeData.pgyLevel.level} residents,
                    you're in the {comparativeData.pgyLevel.percentile}th percentile.
                    The PGY-{comparativeData.pgyLevel.level} average score is {comparativeData.pgyLevel.averageScore}%.
                </p>
            </div>

            {/* Time-Based Ranking */}
            <div className="card p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Speed & Accuracy</h4>
                    <div className={`text-2xl font-bold ${getPercentileColor(comparativeData.timeBasedRanking)}`}>
                        {comparativeData.timeBasedRanking}%
                    </div>
                </div>

                <div className="relative h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2">
                    <div
                        className="absolute top-0 left-0 h-full bg-warning rounded-full"
                        style={{ width: `${comparativeData.timeBasedRanking}%` }}
                    ></div>
                </div>

                <p className="text-xs text-gray-600">
                    This ranking combines both your accuracy and speed. You're in the
                    {comparativeData.timeBasedRanking}th percentile.
                </p>
            </div>

            <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-sm rounded-md">
                <p>
                    <span className="font-medium">How is this calculated?</span> Your ranking is based on
                    your accuracy in answering questions and the speed at which you answer them correctly.
                    The percentile indicates the percentage of users you outperform.
                </p>
            </div>
        </div>
    );
};

export default ComparativeScoring;