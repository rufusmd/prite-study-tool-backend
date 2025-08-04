// src/components/study/ExplanationGenerator.jsx
import { useState, useEffect } from 'react';
import { explanationApi } from '../../api';
import LoadingSpinner from '../common/LoadingSpinner';

const ExplanationGenerator = ({ question, isVisible = false }) => {
    const [explanation, setExplanation] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [generated, setGenerated] = useState(false);
    const [saved, setSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Check if there's already a saved explanation
    useEffect(() => {
        if (question && question.generatedExplanation) {
            setExplanation(question.generatedExplanation);
            setGenerated(true);
            setSaved(true);
        } else {
            setExplanation('');
            setGenerated(false);
            setSaved(false);
        }
    }, [question]);

    // Generate explanation using Claude API
    const generateExplanation = async () => {
        try {
            setLoading(true);
            setError(null);

            // Extract needed question data
            const questionData = {
                question: question.text,
                options: question.options,
                correctAnswer: question.correctAnswer
            };

            const response = await explanationApi.generateExplanation(questionData);

            if (response.success) {
                setExplanation(response.explanation);
                setGenerated(true);
                setSaved(false);
            } else {
                throw new Error(response.error || 'Failed to generate explanation');
            }
        } catch (error) {
            console.error('Error generating explanation:', error);
            setError(error.message || 'Failed to generate explanation');
        } finally {
            setLoading(false);
        }
    };

    // Save explanation to the database
    const saveExplanation = async () => {
        try {
            setIsSaving(true);
            setError(null);

            const response = await explanationApi.saveExplanation(question._id, explanation);

            if (response.success) {
                setSaved(true);
            } else {
                throw new Error(response.error || 'Failed to save explanation');
            }
        } catch (error) {
            console.error('Error saving explanation:', error);
            setError(error.message || 'Failed to save explanation');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div className="mt-6 border-t pt-4">
            {/* Show button to generate explanation if not already generated */}
            {!generated && !loading && (
                <button
                    onClick={generateExplanation}
                    className="btn btn-secondary"
                    disabled={loading}
                >
                    Generate Detailed Explanation
                </button>
            )}

            {/* Loading indicator */}
            {loading && (
                <div className="flex items-center justify-center py-6">
                    <LoadingSpinner size="medium" />
                    <span className="ml-3 text-gray-600">Generating detailed explanation...</span>
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md my-4">
                    <p className="font-bold">Error {saved ? 'saving' : 'generating'} explanation:</p>
                    <p>{error}</p>
                    <button
                        onClick={saved ? saveExplanation : generateExplanation}
                        className="mt-2 text-sm underline"
                    >
                        Try again
                    </button>
                </div>
            )}

            {/* Explanation content */}
            {generated && explanation && (
                <div className="mt-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">Detailed Explanation</h3>

                        {/* Save button (only show if not saved yet) */}
                        {!saved && (
                            <button
                                onClick={saveExplanation}
                                className="btn btn-sm btn-primary"
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <>
                                        <LoadingSpinner size="small" />
                                        <span className="ml-1">Saving...</span>
                                    </>
                                ) : 'Save Explanation'}
                            </button>
                        )}

                        {/* Saved indicator */}
                        {saved && (
                            <span className="text-sm text-success flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Saved
                            </span>
                        )}
                    </div>

                    <div className="prose max-w-none">
                        {explanation.split('\n\n').map((paragraph, index) => (
                            <p key={index} className="mb-4">{paragraph}</p>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExplanationGenerator;