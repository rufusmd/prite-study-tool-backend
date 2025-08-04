// src/components/import/DuplicateResolutionModal.jsx
import { useState, useEffect } from 'react';
import { mergeQuestions } from '../../utils/duplicateDetection';
import LoadingSpinner from '../common/LoadingSpinner';
import Alert from '../common/Alert';

const DuplicateResolutionModal = ({
    duplicates,
    onResolved,
    onCancel,
    defaultStrategy = 'newer'
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [resolutions, setResolutions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);
    const [manualSelections, setManualSelections] = useState({});

    // Initialize resolutions on mount
    useEffect(() => {
        if (duplicates && duplicates.length > 0) {
            const initialResolutions = duplicates.map(dup => {
                const bestMatch = dup.matches[0];
                return {
                    newQuestion: dup.newQuestion,
                    existingQuestion: bestMatch.question,
                    strategy: bestMatch.similarity.mergeStrategy || defaultStrategy,
                    similarity: bestMatch.similarity,
                    resolved: false
                };
            });

            setResolutions(initialResolutions);

            // Initialize manual selections for first question
            initializeManualSelections(0);
        }
    }, [duplicates, defaultStrategy]);

    // Initialize manual selections for a question
    const initializeManualSelections = (index) => {
        if (!duplicates || !duplicates[index]) return;

        const duplicate = duplicates[index];
        const bestMatch = duplicate.matches[0];

        // Default to using primary (existing) question values
        const initialSelections = {
            text: false,
            category: false,
            part: false,
            year: false,
            number: false,
            correctAnswer: false,
            explanation: false
        };

        // For options, initialize each option selection
        for (const letter of ['A', 'B', 'C', 'D', 'E']) {
            initialSelections[`option${letter}`] = false;
        }

        setManualSelections(initialSelections);
    };

    // Handle strategy change
    const handleStrategyChange = (strategy) => {
        const updatedResolutions = [...resolutions];
        updatedResolutions[currentIndex].strategy = strategy;
        setResolutions(updatedResolutions);
    };

    // Handle manual selection change
    const handleSelectionChange = (field, value) => {
        setManualSelections(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Resolve current duplicate
    const resolveCurrentDuplicate = () => {
        const updatedResolutions = [...resolutions];
        const resolution = updatedResolutions[currentIndex];

        // Mark as resolved
        resolution.resolved = true;

        // If manual strategy, save selections
        if (resolution.strategy === 'manual') {
            resolution.manualSelections = { ...manualSelections };
        }

        setResolutions(updatedResolutions);

        // Move to next or finish
        if (currentIndex < duplicates.length - 1) {
            setCurrentIndex(currentIndex + 1);
            initializeManualSelections(currentIndex + 1);
        } else {
            finishResolution();
        }
    };

    // Apply the same strategy to all remaining
    const applyToAll = () => {
        const currentStrategy = resolutions[currentIndex].strategy;

        const updatedResolutions = resolutions.map((resolution, index) => {
            if (index >= currentIndex) {
                return {
                    ...resolution,
                    strategy: currentStrategy,
                    resolved: true,
                    manualSelections: currentStrategy === 'manual' ? { ...manualSelections } : undefined
                };
            }
            return resolution;
        });

        setResolutions(updatedResolutions);
        finishResolution();
    };

    // Skip current duplicate (keep both)
    const skipCurrent = () => {
        const updatedResolutions = [...resolutions];
        updatedResolutions[currentIndex].strategy = 'keepBoth';
        updatedResolutions[currentIndex].resolved = true;
        setResolutions(updatedResolutions);

        // Move to next or finish
        if (currentIndex < duplicates.length - 1) {
            setCurrentIndex(currentIndex + 1);
            initializeManualSelections(currentIndex + 1);
        } else {
            finishResolution();
        }
    };

    // Finish resolution process
    const finishResolution = () => {
        setLoading(true);

        try {
            // Create merged questions based on resolutions
            const mergedQuestions = resolutions.map(resolution => {
                if (resolution.strategy === 'keepBoth') {
                    // For keepBoth, return the new question unmodified
                    return resolution.newQuestion;
                } else {
                    // Otherwise merge according to strategy
                    return mergeQuestions(
                        resolution.existingQuestion,
                        resolution.newQuestion,
                        resolution.strategy,
                        resolution.manualSelections
                    );
                }
            });

            // Call the resolution callback
            onResolved(mergedQuestions, resolutions);
        } catch (error) {
            console.error('Error resolving duplicates:', error);
            setAlert({
                type: 'error',
                message: 'Error resolving duplicates: ' + error.message
            });
        } finally {
            setLoading(false);
        }
    };

    // If no duplicates or already finished, render nothing
    if (!duplicates || duplicates.length === 0) {
        return null;
    }

    // Get current duplicate
    const current = duplicates[currentIndex];
    const currentResolution = resolutions[currentIndex] || {};
    const bestMatch = current?.matches[0];
    const similarity = bestMatch?.similarity;

    // Helper function to format date
    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-4 border-b sticky top-0 bg-white z-10">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-bold">Duplicate Questions Detected</h2>
                        <div className="text-sm text-gray-600">
                            Question {currentIndex + 1} of {duplicates.length}
                        </div>
                    </div>

                    {alert && (
                        <div className="mt-2">
                            <Alert
                                type={alert.type}
                                message={alert.message}
                                onClose={() => setAlert(null)}
                            />
                        </div>
                    )}
                </div>

                <div className="p-4">
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-4">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 mt-0.5">
                                <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-yellow-800">Possible duplicate detected ({Math.round(similarity.score * 100)}% match)</h3>
                                <div className="mt-2 text-sm text-yellow-700">
                                    <ul className="list-disc pl-5 space-y-1">
                                        {similarity.reasons.map((reason, index) => (
                                            <li key={index}>{reason}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Existing Question */}
                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-gray-100 p-3 border-b">
                                <h3 className="font-bold">Existing Question</h3>
                                <div className="text-xs text-gray-500">
                                    Added {formatDate(currentResolution.existingQuestion?.createdAt)}
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="mb-2 flex flex-wrap gap-2">
                                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                                        Part {currentResolution.existingQuestion?.part || "?"}
                                    </span>
                                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                                        Year {currentResolution.existingQuestion?.year || "?"}
                                    </span>
                                    {currentResolution.existingQuestion?.number && (
                                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                                            #{currentResolution.existingQuestion.number}
                                        </span>
                                    )}
                                    {currentResolution.existingQuestion?.category && (
                                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                            {currentResolution.existingQuestion.category}
                                        </span>
                                    )}
                                </div>

                                <p className="mb-3">{currentResolution.existingQuestion?.text}</p>

                                <div className="space-y-1 text-sm">
                                    {currentResolution.existingQuestion?.options &&
                                        Object.entries(currentResolution.existingQuestion.options).map(([letter, text]) => (
                                            text && (
                                                <div key={letter} className={`p-2 rounded-md ${letter === currentResolution.existingQuestion.correctAnswer
                                                        ? 'bg-green-50 border-l-4 border-green-500'
                                                        : 'bg-gray-50'
                                                    }`}>
                                                    <span className="font-bold">{letter}:</span> {text}
                                                </div>
                                            )
                                        ))}
                                </div>

                                {currentResolution.existingQuestion?.explanation && (
                                    <div className="mt-3 p-2 bg-gray-50 text-sm border-l-4 border-gray-300">
                                        <span className="font-bold">Explanation:</span> {currentResolution.existingQuestion.explanation}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* New Question */}
                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-blue-50 p-3 border-b">
                                <h3 className="font-bold">New Question</h3>
                            </div>
                            <div className="p-4">
                                <div className="mb-2 flex flex-wrap gap-2">
                                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                                        Part {current.newQuestion?.part || "?"}
                                    </span>
                                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                                        Year {current.newQuestion?.year || "?"}
                                    </span>
                                    {current.newQuestion?.number && (
                                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                                            #{current.newQuestion.number}
                                        </span>
                                    )}
                                    {current.newQuestion?.category && (
                                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                            {current.newQuestion.category}
                                        </span>
                                    )}
                                </div>

                                <p className="mb-3">{current.newQuestion?.text}</p>

                                <div className="space-y-1 text-sm">
                                    {current.newQuestion?.options &&
                                        Object.entries(current.newQuestion.options).map(([letter, text]) => (
                                            text && (
                                                <div key={letter} className={`p-2 rounded-md ${letter === current.newQuestion.correctAnswer
                                                        ? 'bg-green-50 border-l-4 border-green-500'
                                                        : 'bg-gray-50'
                                                    }`}>
                                                    <span className="font-bold">{letter}:</span> {text}
                                                </div>
                                            )
                                        ))}
                                </div>

                                {current.newQuestion?.explanation && (
                                    <div className="mt-3 p-2 bg-gray-50 text-sm border-l-4 border-gray-300">
                                        <span className="font-bold">Explanation:</span> {current.newQuestion.explanation}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Resolution Options */}
                    <div className="mt-6 border rounded-lg p-4">
                        <h3 className="font-bold mb-3">Resolution Strategy</h3>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                            <div
                                onClick={() => handleStrategyChange('newer')}
                                className={`p-3 border rounded-lg cursor-pointer ${currentResolution.strategy === 'newer'
                                        ? 'bg-primary/10 border-primary'
                                        : 'hover:bg-gray-50'
                                    }`}
                            >
                                <div className="font-medium mb-1">Use Newer</div>
                                <div className="text-xs text-gray-600">
                                    Keep the more recently created question
                                </div>
                            </div>

                            <div
                                onClick={() => handleStrategyChange('metadata')}
                                className={`p-3 border rounded-lg cursor-pointer ${currentResolution.strategy === 'metadata'
                                        ? 'bg-primary/10 border-primary'
                                        : 'hover:bg-gray-50'
                                    }`}
                            >
                                <div className="font-medium mb-1">Use Metadata</div>
                                <div className="text-xs text-gray-600">
                                    Use existing question but ensure correct metadata
                                </div>
                            </div>

                            <div
                                onClick={() => handleStrategyChange('manual')}
                                className={`p-3 border rounded-lg cursor-pointer ${currentResolution.strategy === 'manual'
                                        ? 'bg-primary/10 border-primary'
                                        : 'hover:bg-gray-50'
                                    }`}
                            >
                                <div className="font-medium mb-1">Manual Merge</div>
                                <div className="text-xs text-gray-600">
                                    Select which fields to keep from each question
                                </div>
                            </div>

                            <div
                                onClick={() => handleStrategyChange('keepBoth')}
                                className={`p-3 border rounded-lg cursor-pointer ${currentResolution.strategy === 'keepBoth'
                                        ? 'bg-primary/10 border-primary'
                                        : 'hover:bg-gray-50'
                                    }`}
                            >
                                <div className="font-medium mb-1">Keep Both</div>
                                <div className="text-xs text-gray-600">
                                    Import as a new question, don't merge
                                </div>
                            </div>
                        </div>

                        {/* Manual Field Selection */}
                        {currentResolution.strategy === 'manual' && (
                            <div className="mt-4 border-t pt-4">
                                <h4 className="font-medium mb-2">Select Fields to Use from New Question</h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="field-text"
                                            checked={manualSelections.text}
                                            onChange={(e) => handleSelectionChange('text', e.target.checked)}
                                            className="mr-2"
                                        />
                                        <label htmlFor="field-text">Question Text</label>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="field-category"
                                            checked={manualSelections.category}
                                            onChange={(e) => handleSelectionChange('category', e.target.checked)}
                                            className="mr-2"
                                        />
                                        <label htmlFor="field-category">Category</label>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="field-part"
                                            checked={manualSelections.part}
                                            onChange={(e) => handleSelectionChange('part', e.target.checked)}
                                            className="mr-2"
                                        />
                                        <label htmlFor="field-part">Part</label>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="field-year"
                                            checked={manualSelections.year}
                                            onChange={(e) => handleSelectionChange('year', e.target.checked)}
                                            className="mr-2"
                                        />
                                        <label htmlFor="field-year">Year</label>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="field-number"
                                            checked={manualSelections.number}
                                            onChange={(e) => handleSelectionChange('number', e.target.checked)}
                                            className="mr-2"
                                        />
                                        <label htmlFor="field-number">Question Number</label>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="field-answer"
                                            checked={manualSelections.correctAnswer}
                                            onChange={(e) => handleSelectionChange('correctAnswer', e.target.checked)}
                                            className="mr-2"
                                        />
                                        <label htmlFor="field-answer">Correct Answer</label>
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="field-explanation"
                                            checked={manualSelections.explanation}
                                            onChange={(e) => handleSelectionChange('explanation', e.target.checked)}
                                            className="mr-2"
                                        />
                                        <label htmlFor="field-explanation">Explanation</label>
                                    </div>

                                    {['A', 'B', 'C', 'D', 'E'].map(letter => (
                                        <div key={letter} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={`field-option${letter}`}
                                                checked={manualSelections[`option${letter}`]}
                                                onChange={(e) => handleSelectionChange(`option${letter}`, e.target.checked)}
                                                className="mr-2"
                                            />
                                            <label htmlFor={`field-option${letter}`}>Option {letter}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t flex justify-between">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 border rounded-md"
                        disabled={loading}
                    >
                        Cancel
                    </button>

                    <div className="flex space-x-2">
                        <button
                            onClick={skipCurrent}
                            className="px-4 py-2 border rounded-md"
                            disabled={loading}
                        >
                            Skip This Question
                        </button>

                        <button
                            onClick={resolveCurrentDuplicate}
                            className="px-4 py-2 bg-primary text-white rounded-md"
                            disabled={loading}
                        >
                            {loading ? <LoadingSpinner size="small" /> : 'Apply & Continue'}
                        </button>

                        <button
                            onClick={applyToAll}
                            className="px-4 py-2 bg-success text-white rounded-md"
                            disabled={loading}
                        >
                            Apply to All Remaining
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DuplicateResolutionModal;