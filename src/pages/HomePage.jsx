// src/pages/HomePage.jsx
import { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QuestionContext } from '../contexts/QuestionContext';
import { AuthContext } from '../contexts/AuthContext';
import Alert from '../components/common/Alert';
import LoadingSpinner from '../components/common/LoadingSpinner';

const HomePage = () => {
    const { user } = useContext(AuthContext);
    const { dueQuestions, questions, categoryStats, userStats, loading } = useContext(QuestionContext);
    const [alert, setAlert] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        due: 0,
        mastered: 0
    });

    // Calculate stats
    useEffect(() => {
        if (questions.length > 0) {
            const mastered = questions.filter(q => {
                const userData = q.studyData?.find(data => data.user === q.creator);
                return userData?.easeFactor > 2.5;
            }).length;

            setStats({
                total: questions.length,
                due: dueQuestions.length,
                mastered
            });
        }
    }, [questions, dueQuestions]);

    // Get top categories for display
    const topCategories = Object.entries(categoryStats)
        .filter(([_, data]) => data.total > 0)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 3);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

            {alert && (
                <Alert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert(null)}
                />
            )}

            {/* Greeting section */}
            <div className="card p-6 mb-6">
                <h3 className="text-xl font-bold mb-2">Welcome back, {user?.username}!</h3>

                {userStats.streakDays > 0 ? (
                    <div className="flex items-center">
                        <div className="flex space-x-1 mr-2">
                            {[...Array(Math.min(userStats.streakDays, 5))].map((_, i) => (
                                <div key={i} className="w-2 h-8 bg-primary rounded"></div>
                            ))}
                        </div>
                        <p className="text-gray-700">
                            You're on a <span className="font-bold text-primary">{userStats.streakDays}-day</span> study streak!
                            Keep it up!
                        </p>
                    </div>
                ) : (
                    <p className="text-gray-700">
                        Start studying today to build your streak!
                    </p>
                )}
            </div>

            {/* Main stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="card p-4 flex flex-col items-center">
                    <h3 className="text-lg font-semibold text-gray-700">Total</h3>
                    <p className="text-3xl font-bold text-primary mt-2">{stats.total}</p>
                </div>

                <div className="card p-4 flex flex-col items-center">
                    <h3 className="text-lg font-semibold text-gray-700">Due Today</h3>
                    <p className="text-3xl font-bold text-warning mt-2">{stats.due}</p>
                </div>

                <div className="card p-4 flex flex-col items-center">
                    <h3 className="text-lg font-semibold text-gray-700">Mastered</h3>
                    <p className="text-3xl font-bold text-success mt-2">{stats.mastered}</p>
                </div>
            </div>

            {/* Study progress */}
            <div className="card mb-6">
                <h3 className="text-lg font-bold mb-4 p-4 border-b">Study Progress</h3>

                <div className="p-4">
                    <div className="relative pt-1">
                        <div className="flex mb-2 items-center justify-between">
                            <div>
                                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary bg-primary/10">
                                    Overall Mastery
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-xs font-semibold inline-block text-primary">
                                    {userStats.masteryLevel}%
                                </span>
                            </div>
                        </div>
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                            <div
                                style={{ width: `${userStats.masteryLevel}%` }}
                                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                            ></div>
                        </div>
                    </div>

                    {/* Recent performance indicator */}
                    {userStats.recentPerformance.length > 0 && (
                        <div className="mt-4">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium">Recent Questions</span>
                                <span className="text-gray-600">
                                    {userStats.recentPerformance.filter(q => q.isCorrect).length}/{userStats.recentPerformance.length} correct
                                </span>
                            </div>
                            <div className="flex space-x-1">
                                {userStats.recentPerformance.map((item, index) => (
                                    <div
                                        key={index}
                                        className={`flex-grow h-2 ${item.isCorrect ? 'bg-success' : 'bg-danger'} rounded`}
                                    ></div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Category progress */}
            {topCategories.length > 0 && (
                <div className="card mb-6">
                    <h3 className="text-lg font-bold mb-2 p-4 border-b">Category Progress</h3>

                    <div className="p-4 space-y-4">
                        {topCategories.map(([category, data]) => (
                            <div key={category}>
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium">{category}</span>
                                    <span className="text-xs text-gray-500">
                                        {data.total} questions • {data.mastered} mastered
                                    </span>
                                </div>
                                <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-gray-200">
                                    <div
                                        style={{ width: `${data.accuracy}%` }}
                                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-success"
                                    ></div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>{data.accuracy}% mastery</span>
                                    {data.due > 0 && (
                                        <span className="text-warning">{data.due} due</span>
                                    )}
                                </div>
                            </div>
                        ))}

                        <Link to="/browse" className="text-primary text-sm font-medium block text-center">
                            View all categories →
                        </Link>
                    </div>
                </div>
            )}

            {/* Areas to improve */}
            {userStats.weakestCategories.length > 0 && (
                <div className="card mb-6">
                    <h3 className="text-lg font-bold mb-2 p-4 border-b">Areas to Improve</h3>

                    <div className="p-4">
                        <div className="space-y-2">
                            {userStats.weakestCategories.map(category => (
                                <div key={category.name} className="p-3 bg-gray-50 rounded-lg">
                                    <div className="flex justify-between">
                                        <span className="font-medium">{category.name}</span>
                                        <span className="text-xs px-2 py-1 bg-warning/10 text-warning rounded-full">
                                            {category.accuracy}% accuracy
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Ready to study card */}
            <div className="card mb-6">
                <h3 className="text-lg font-bold mb-4 p-4 border-b">Ready to Study?</h3>

                <div className="p-4">
                    <p className="text-gray-600 mb-4">
                        You have <span className="font-bold text-warning">{stats.due}</span> questions due for review today.
                    </p>

                    <Link
                        to="/study"
                        className="btn btn-primary w-full block text-center"
                    >
                        Start Studying
                    </Link>
                </div>
            </div>

            {/* Add questions card */}
            <div className="card">
                <h3 className="text-lg font-bold mb-4 p-4 border-b">Need More Questions?</h3>

                <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Link
                            to="/capture"
                            className="btn btn-secondary w-full block text-center"
                        >
                            Capture Questions
                        </Link>

                        <Link
                            to="/import"
                            className="btn btn-secondary w-full block text-center"
                        >
                            Import Questions
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;