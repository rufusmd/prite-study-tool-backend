// src/components/study/StudyStats.jsx
import { useContext } from 'react';
import { QuestionContext } from '../../contexts/QuestionContext';

const StudyStats = () => {
    const { sessionStats, userStats } = useContext(QuestionContext);

    return (
        <div className="study-stats">
            {/* Session Performance */}
            <div className="mb-8">
                <h3 className="text-lg font-bold mb-4">Session Performance</h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <div className="text-3xl font-bold text-primary">{sessionStats.questionsAnswered}</div>
                        <div className="text-sm text-gray-600">Questions</div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <div className="text-3xl font-bold text-success">{sessionStats.accuracy}%</div>
                        <div className="text-sm text-gray-600">Accuracy</div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <div className="text-3xl font-bold text-warning">{sessionStats.averageTime}s</div>
                        <div className="text-sm text-gray-600">Avg. Time</div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <div className="text-3xl font-bold text-info">{sessionStats.correctAnswers}</div>
                        <div className="text-sm text-gray-600">Correct</div>
                    </div>
                </div>
            </div>

            {/* Accuracy Gauge */}
            <div className="mb-8">
                <h3 className="text-lg font-bold mb-4">Session Accuracy</h3>

                <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="absolute top-0 left-0 h-full bg-success"
                        style={{ width: `${sessionStats.accuracy}%` }}
                    ></div>
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-sm font-bold">
                        {sessionStats.accuracy}%
                    </div>
                </div>

                <div className="flex justify-between mt-2">
                    <span className="text-xs text-gray-500">0%</span>
                    <span className="text-xs text-gray-500">50%</span>
                    <span className="text-xs text-gray-500">100%</span>
                </div>
            </div>

            {/* Study Streak */}
            <div className="mb-8">
                <h3 className="text-lg font-bold mb-4">Study Streak</h3>

                <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="bg-primary/10 text-primary text-3xl font-bold w-16 h-16 rounded-full flex items-center justify-center">
                        {userStats.streakDays}
                    </div>
                    <div className="text-lg font-medium">
                        {userStats.streakDays === 0 ? (
                            <span>Start your streak today!</span>
                        ) : userStats.streakDays === 1 ? (
                            <span>1 day streak!</span>
                        ) : (
                            <span>{userStats.streakDays} day streak!</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Overall Progress */}
            <div className="mb-8">
                <h3 className="text-lg font-bold mb-4">Overall Progress</h3>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <div className="text-2xl font-bold text-primary">{userStats.totalStudied}</div>
                        <div className="text-sm text-gray-600">Questions Studied</div>
                    </div>

                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                        <div className="text-2xl font-bold text-success">{userStats.masteryLevel}%</div>
                        <div className="text-sm text-gray-600">Mastery Level</div>
                    </div>
                </div>

                {/* Mastery progress bar */}
                <div className="mt-4">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">Overall Mastery</span>
                        <span className="text-sm font-medium text-gray-700">{userStats.masteryLevel}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className="bg-success h-2.5 rounded-full"
                            style={{ width: `${userStats.masteryLevel}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Category Performance */}
            {userStats.weakestCategories.length > 0 && (
                <div className="mb-8">
                    <h3 className="text-lg font-bold mb-4">Categories to Focus On</h3>

                    <div className="space-y-4">
                        {userStats.weakestCategories.map(category => (
                            <div key={category.name} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="font-medium">{category.name}</div>
                                    <div className="text-sm text-gray-600">{category.accuracy}% accuracy</div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className="bg-warning h-2.5 rounded-full"
                                        style={{ width: `${category.accuracy}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Strongest Categories */}
            {userStats.strongestCategories.length > 0 && (
                <div className="mb-6">
                    <h3 className="text-lg font-bold mb-4">Your Strongest Categories</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userStats.strongestCategories.map(category => (
                            <div key={category.name} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="font-medium">{category.name}</div>
                                    <div className="text-sm text-gray-600">{category.accuracy}%</div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className="bg-success h-2.5 rounded-full"
                                        style={{ width: `${category.accuracy}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Performance */}
            {userStats.recentPerformance.length > 0 && (
                <div>
                    <h3 className="text-lg font-bold mb-4">Recent Performance</h3>

                    <div className="overflow-hidden flex space-x-1 mb-2">
                        {userStats.recentPerformance.map((item, index) => (
                            <div
                                key={index}
                                className={`flex-grow h-2 ${item.isCorrect ? 'bg-success' : 'bg-danger'} rounded`}
                            ></div>
                        ))}
                    </div>

                    <div className="flex justify-between text-xs text-gray-500">
                        <span>Last {userStats.recentPerformance.length} questions</span>
                        <span>
                            {userStats.recentPerformance.filter(q => q.isCorrect).length} correct
                            ({Math.round((userStats.recentPerformance.filter(q => q.isCorrect).length / userStats.recentPerformance.length) * 100)}%)
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudyStats;