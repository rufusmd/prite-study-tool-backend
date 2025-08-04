// src/components/browse/AnswerEditModal.jsx
import { useState } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import api from '../../utils/api';
import Alert from '../common/Alert';

const AnswerEditModal = ({ question, onClose, onUpdate }) => {
    const [correctAnswer, setCorrectAnswer] = useState(question.correctAnswer || '');
    const [explanation, setExplanation] = useState(question.explanation || '');
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);

    const handleSave = async () => {
        try {
            setLoading(true);

            const response = await api.patch(`/questions/${question._id}`, {
                correctAnswer,
                explanation
            });

            if (response.data) {
                setAlert({
                    type: 'success',
                    message: 'Question updated successfully'
                });

                setTimeout(() => {
                    if (onUpdate) onUpdate(response.data);
                    onClose();
                }, 1500);
            } else {
                throw new Error('Failed to update question');
            }
        } catch (error) {
            console.error('Error updating question:', error);
            setAlert({
                type: 'error',
                message: error.message || 'Failed to update question'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="p-4 border-b">
                    <h2 className="text-lg font-bold">Edit Answer</h2>
                </div>

                {alert && (
                    <div className="p-4">
                        <Alert
                            type={alert.type}
                            message={alert.message}
                            onClose={() => setAlert(null)}
                        />
                    </div>
                )}

                <div className="p-4">
                    <div className="mb-4">
                        <h3 className="font-medium mb-2">Question:</h3>
                        <p className="text-gray-700">{question.text}</p>
                    </div>

                    <div className="mb-4">
                        <h3 className="font-medium mb-2">Options:</h3>
                        <div className="space-y-2">
                            {Object.entries(question.options).map(([letter, text]) => (
                                text && (
                                    <div
                                        key={letter}
                                        className={`p-2 rounded-md ${correctAnswer === letter
                                                ? 'bg-green-50 border-l-4 border-green-500'
                                                : 'bg-gray-50'
                                            }`}
                                        onClick={() => setCorrectAnswer(letter)}
                                    >
                                        <span className="font-bold">{letter}:</span> {text}
                                    </div>
                                )
                            ))}
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                            Correct Answer:
                        </label>
                        <select
                            value={correctAnswer}
                            onChange={(e) => setCorrectAnswer(e.target.value)}
                            className="w-full p-2 border rounded-md"
                        >
                            <option value="">Select Correct Answer</option>
                            {Object.entries(question.options).map(([letter, text]) => (
                                text && (
                                    <option key={letter} value={letter}>
                                        {letter}: {text.substring(0, 50)}...
                                    </option>
                                )
                            ))}
                        </select>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                            Explanation:
                        </label>
                        <textarea
                            value={explanation}
                            onChange={(e) => setExplanation(e.target.value)}
                            className="w-full p-2 border rounded-md"
                            rows="4"
                            placeholder="Add an explanation for this question"
                        />
                    </div>
                </div>

                <div className="p-4 border-t flex justify-end space-x-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border rounded-md"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-primary text-white rounded-md flex items-center"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <LoadingSpinner size="small" className="mr-2" />
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AnswerEditModal;