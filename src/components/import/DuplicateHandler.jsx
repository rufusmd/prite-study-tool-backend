// src/components/import/DuplicateHandler.jsx
import React, { useState, useEffect } from 'react';
import { detectDuplicates } from '../../utils/duplicateDetection';
import DuplicateResolutionModal from './DuplicateResolutionModal';
import LoadingSpinner from '../common/LoadingSpinner';
import Alert from '../common/Alert';

const DuplicateHandler = ({
    questions,
    existingQuestions,
    onProcessComplete,
    onCancel
}) => {
    const [loading, setLoading] = useState(true);
    const [duplicates, setDuplicates] = useState([]);
    const [nonDuplicates, setNonDuplicates] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [progress, setProgress] = useState(0);
    const [alert, setAlert] = useState(null);

    // Scan for duplicates when component mounts
    useEffect(() => {
        if (questions && existingQuestions) {
            detectDuplicateQuestions();
        }
    }, [questions, existingQuestions]);

    // Process questions and detect duplicates
    const detectDuplicateQuestions = async () => {
        setLoading(true);

        try {
            const duplicatesList = [];
            const nonDuplicatesList = [];

            // For large lists, process in batches
            for (let i = 0; i < questions.length; i++) {
                const question = questions[i];

                // Detect potential duplicates
                const result = detectDuplicates(question, existingQuestions, {
                    textThreshold: 0.7,
                    optionsThreshold: 0.6,
                    minMatches: 2
                });

                // Update progress
                setProgress(Math.round(((i + 1) / questions.length) * 100));

                if (result.isDuplicate) {
                    duplicatesList.push({
                        newQuestion: question,
                        matches: result.matches,
                        reasons: result.reasons
                    });
                } else {
                    nonDuplicatesList.push(question);
                }

                // Add a small delay to prevent UI freezing
                if (i % 10 === 0 && i > 0) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }

            setDuplicates(duplicatesList);
            setNonDuplicates(nonDuplicatesList);

            // Show modal if duplicates found
            if (duplicatesList.length > 0) {
                setShowModal(true);
            } else {
                // No duplicates, proceed directly
                handleResolution([], nonDuplicatesList);
            }
        } catch (error) {
            console.error('Error detecting duplicates:', error);
            setAlert({
                type: 'error',
                message: 'Error detecting duplicates: ' + error.message
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle resolution from the modal
    const handleResolution = (mergedQuestions, keptQuestions = []) => {
        try {
            // Combine non-duplicates with resolved duplicates
            const finalQuestions = [...nonDuplicates, ...keptQuestions];

            // Calculate stats
            const stats = {
                total: questions.length,
                duplicates: duplicates.length,
                merged: duplicates.length - keptQuestions.length,
                imported: finalQuestions.length
            };

            // Close modal
            setShowModal(false);

            // Call the completion handler
            onProcessComplete(finalQuestions, stats);
        } catch (error) {
            console.error('Error resolving duplicates:', error);
            setAlert({
                type: 'error',
                message: 'Error resolving duplicates: ' + error.message
            });
        }
    };

    // Cancel the duplicate detection process
    const handleCancel = () => {
        setShowModal(false);
        if (onCancel) onCancel();
    };

    // If still processing, show loading
    if (loading) {
        return (
            <div className="p-6 bg-white rounded-lg text-center">
                <LoadingSpinner />
                <p className="mt-4 font-medium">Checking for duplicate questions...</p>

                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                    <div
                        className="bg-primary h-2.5 rounded-full"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <p className="text-sm text-gray-500 mt-2">Progress: {progress}%</p>
            </div>
        );
    }

    return (
        <div>
            {alert && (
                <Alert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert(null)}
                />
            )}

            {/* Duplicate resolution modal */}
            {showModal && (
                <DuplicateResolutionModal
                    duplicates={duplicates}
                    onResolved={handleResolution}
                    onCancel={handleCancel}
                />
            )}

            {/* If modal is not shown and not loading, show a summary */}
            {!showModal && !loading && (
                <div className="p-6 bg-white rounded-lg">
                    <h3 className="text-lg font-bold mb-4">Duplicate Detection Complete</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold">{questions.length}</div>
                            <div className="text-sm text-gray-600">Total Questions</div>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold">{duplicates.length}</div>
                            <div className="text-sm text-blue-600">Potential Duplicates</div>
                        </div>
                    </div>

                    {duplicates.length > 0 ? (
                        <button
                            onClick={() => setShowModal(true)}
                            className="w-full py-2 px-4 bg-primary text-white rounded-md"
                        >
                            Review Duplicates
                        </button>
                    ) : (
                        <p className="text-green-600 font-medium">No duplicates found. Proceeding with import.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default DuplicateHandler;