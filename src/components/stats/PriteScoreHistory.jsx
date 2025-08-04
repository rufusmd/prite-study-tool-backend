// src/components/stats/PriteScoreHistory.jsx
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import Alert from '../common/Alert';
import PriteScoreEntry from '../onboarding/PriteScoreEntry';
import priteScoreApi from '../../api/priteScoreApi';

const PriteScoreHistory = () => {
    const { user } = useContext(AuthContext);
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [alert, setAlert] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [scoreToEdit, setScoreToEdit] = useState(null);

    // Fetch user's PRITE score history
    useEffect(() => {
        const fetchScores = async () => {
            try {
                setLoading(true);

                // Call the API to get scores
                const response = await priteScoreApi.getScores();

                if (response.success) {
                    setScores(response.scores || []);
                } else {
                    throw new Error(response.error || 'Failed to fetch PRITE scores');
                }
            } catch (error) {
                console.error('Error fetching PRITE scores:', error);
                setError(error.message || 'Failed to fetch PRITE scores');
            } finally {
                setLoading(false);
            }
        };

        fetchScores();
    }, []);

    // Delete a score entry
    const handleDelete = async (scoreId) => {
        try {
            if (!window.confirm('Are you sure you want to delete this score record?')) {
                return;
            }

            setLoading(true);

            // Call the API to delete the score
            const response = await priteScoreApi.deleteScore(scoreId);

            if (response.success) {
                // Update state by removing the deleted score
                setScores(prev => prev.filter(score => score._id !== scoreId));

                setAlert({
                    type: 'success',
                    message: 'Score deleted successfully'
                });
            } else {
                throw new Error(response.error || 'Failed to delete score');
            }
        } catch (error) {
            console.error('Error deleting score record:', error);
            setAlert({
                type: 'error',
                message: error.message || 'Failed to delete score record'
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle score add/edit completion
    const handleScoreComplete = (newScore) => {
        if (newScore) {
            if (scoreToEdit) {
                // Update existing score in state
                setScores(prev => prev.map(score =>
                    score._id === newScore._id ? newScore : score
                ));
            } else {
                // Add new score to state
                setScores(prev => [newScore, ...prev]);
            }
        }

        setShowAddForm(false);
        setScoreToEdit(null);
    };

    // Edit a score
    const handleEdit = (score) => {
        setScoreToEdit(score);
        setShowAddForm(true);
    };

    // Calculate improvement
    const calculateImprovement = () => {
        if (scores.length < 2) return null;

        // Sort by year ascending (oldest first)
        const sortedScores = [...scores].sort((a, b) =>
            parseInt(a.year) - parseInt(b.year)
        );

        const firstScore = sortedScores[0];
        const latestScore = sortedScores[sortedScores.length - 1];

        return {
            overall: latestScore.overallPercentile - firstScore.overallPercentile,
            psychiatry: latestScore.psychiatryPercentile && firstScore.psychiatryPercentile
                ? latestScore.psychiatryPercentile - firstScore.psychiatryPercentile
                : null,
            neuroscience: latestScore.neurosciencePercentile && firstScore.neurosciencePercentile
                ? latestScore.neurosciencePercentile - firstScore.neurosciencePercentile
                : null,
            soma: latestScore.somaPercentile && firstScore.somaPercentile
                ? latestScore.somaPercentile - firstScore.somaPercentile
                : null,
            growth: latestScore.growthPercentile && firstScore.growthPercentile
                ? latestScore.growthPercentile - firstScore.growthPercentile
                : null,
            years: parseInt(latestScore.year) - parseInt(firstScore.year)
        };
    };

    const improvement = scores.length >= 2 ? calculateImprovement() : null;

    // Helper function to format improvement value
    const formatImprovement = (value) => {
        if (value === null || value === undefined) return 'N/A';
        return value > 0 ? `+${value}` : value.toString();
    };

    // If showing add/edit form
    if (showAddForm) {
        return (
            <div className="mt-4">
                <div className="mb-4">
                    <button
                        onClick={() => {
                            setShowAddForm(false);
                            setScoreToEdit(null);
                        }}
                        className="flex items-center text-primary"
                    >
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Score History
                    </button>
                </div>

                <PriteScoreEntry
                    user={user}
                    onComplete={handleScoreComplete}
                    initialData={scoreToEdit}
                    isOnboarding={false}
                />
            </div>
        );
    }

    if (loading && scores.length === 0) {
        return (
            <div className="flex justify-center items-center p-8">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="prite-score-history">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">PRITE Score History</h2>

                <button
                    onClick={() => setShowAddForm(true)}
                    className="btn btn-primary text-sm"
                >
                    Add New Score
                </button>
            </div>

            {error && (
                <Alert
                    type="error"
                    message={error}
                    onClose={() => setError(null)}
                    className="mb-4"
                />
            )}

            {alert && (
                <Alert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert(null)}
                    className="mb-4"
                />
            )}

            {scores.length === 0 ? (
                <div className="card p-6 text-center">
                    <p className="text-gray-600 mb-4">
                        You haven't added any PRITE scores yet. Adding your scores helps track your progress over time.
                    </p>

                    <button
                        onClick={() => setShowAddForm(true)}
                        className="btn btn-primary"
                    >
                        Add Your PRITE Scores
                    </button>
                </div>
            ) : (
                <div>
                    {/* Improvement Summary */}
                    {improvement && (
                        <div className="card p-4 mb-6 bg-blue-50">
                            <h3 className="font-bold text-blue-800 mb-2">
                                {improvement.years > 0
                                    ? `${improvement.years}-Year Improvement`
                                    : 'Progress Since First PRITE'
                                }
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div className="text-center">
                                    <div className={`text-2xl font-bold ${improvement.overall > 0 ? 'text-success' : improvement.overall < 0 ? 'text-danger' : 'text-gray-600'}`}>
                                        {formatImprovement(improvement.overall)}
                                    </div>
                                    <div className="text-xs text-gray-600">Overall</div>
                                </div>

                                <div className="text-center">
                                    <div className={`text-2xl font-bold ${improvement.psychiatry > 0 ? 'text-success' : improvement.psychiatry < 0 ? 'text-danger' : 'text-gray-600'}`}>
                                        {formatImprovement(improvement.psychiatry)}
                                    </div>
                                    <div className="text-xs text-gray-600">Psychiatry</div>
                                </div>

                                <div className="text-center">
                                    <div className={`text-2xl font-bold ${improvement.neuroscience > 0 ? 'text-success' : improvement.neuroscience < 0 ? 'text-danger' : 'text-gray-600'}`}>
                                        {formatImprovement(improvement.neuroscience)}
                                    </div>
                                    <div className="text-xs text-gray-600">Neuroscience</div>
                                </div>

                                <div className="text-center">
                                    <div className={`text-2xl font-bold ${improvement.soma > 0 ? 'text-success' : improvement.soma < 0 ? 'text-danger' : 'text-gray-600'}`}>
                                        {formatImprovement(improvement.soma)}
                                    </div>
                                    <div className="text-xs text-gray-600">Somatic</div>
                                </div>

                                <div className="text-center">
                                    <div className={`text-2xl font-bold ${improvement.growth > 0 ? 'text-success' : improvement.growth < 0 ? 'text-danger' : 'text-gray-600'}`}>
                                        {formatImprovement(improvement.growth)}
                                    </div>
                                    <div className="text-xs text-gray-600">Growth</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Score History Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="py-2 px-4 border-b text-left">Year</th>
                                    <th className="py-2 px-4 border-b text-left">Overall</th>
                                    <th className="py-2 px-4 border-b text-left">Psychiatry</th>
                                    <th className="py-2 px-4 border-b text-left">Neuroscience</th>
                                    <th className="py-2 px-4 border-b text-left">Somatic</th>
                                    <th className="py-2 px-4 border-b text-left">Growth</th>
                                    <th className="py-2 px-4 border-b text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {scores.map((score) => (
                                    <tr key={score._id} className="hover:bg-gray-50">
                                        <td className="py-2 px-4 border-b">{score.year}</td>
                                        <td className="py-2 px-4 border-b">{score.overallPercentile}%</td>
                                        <td className="py-2 px-4 border-b">{score.psychiatryPercentile ? `${score.psychiatryPercentile}%` : '-'}</td>
                                        <td className="py-2 px-4 border-b">{score.neurosciencePercentile ? `${score.neurosciencePercentile}%` : '-'}</td>
                                        <td className="py-2 px-4 border-b">{score.somaPercentile ? `${score.somaPercentile}%` : '-'}</td>
                                        <td className="py-2 px-4 border-b">{score.growthPercentile ? `${score.growthPercentile}%` : '-'}</td>
                                        <td className="py-2 px-4 border-b">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEdit(score)}
                                                    className="text-primary"
                                                    title="Edit"
                                                >
                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>

                                                <button
                                                    onClick={() => handleDelete(score._id)}
                                                    className="text-red-500"
                                                    title="Delete"
                                                >
                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Additional Sections */}
                    {scores.some(score => score.sections && score.sections.length > 0) && (
                        <div className="mt-6">
                            <h3 className="font-bold mb-2">Additional Sections</h3>

                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="py-2 px-4 border-b text-left">Year</th>
                                            <th className="py-2 px-4 border-b text-left">Section</th>
                                            <th className="py-2 px-4 border-b text-left">Percentile</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {scores.flatMap(score =>
                                            (score.sections || []).map((section, index) => (
                                                <tr key={`${score._id}-${index}`} className="hover:bg-gray-50">
                                                    <td className="py-2 px-4 border-b">{score.year}</td>
                                                    <td className="py-2 px-4 border-b">{section.name}</td>
                                                    <td className="py-2 px-4 border-b">{section.percentile}%</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {scores.some(score => score.notes) && (
                        <div className="mt-6">
                            <h3 className="font-bold mb-2">Notes</h3>

                            {scores.filter(score => score.notes).map(score => (
                                <div key={`${score._id}-notes`} className="card p-4 mb-2">
                                    <div className="font-medium text-sm text-gray-600 mb-1">
                                        {score.year} PRITE Notes:
                                    </div>
                                    <p className="text-gray-800">{score.notes}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PriteScoreHistory;