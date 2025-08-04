// src/pages/ImportPage.jsx with integrated duplicate detection
// This shows how the various components work together for the complete feature
import React, { useState, useEffect, useContext } from 'react';
import { QuestionContext } from '../contexts/QuestionContext';
import BulkImport from '../components/import/BulkImport';
import DuplicateHandler from '../components/import/DuplicateHandler';
import Alert from '../components/common/Alert';
import LoadingSpinner from '../components/common/LoadingSpinner';
import api from '../utils/api';
import { processBulkImport } from '../utils/bulkImportProcessor';

const ImportPage = () => {
    const { questions } = useContext(QuestionContext);
    const [activeTab, setActiveTab] = useState('bulk');
    const [uploadedQuestions, setUploadedQuestions] = useState([]);
    const [importStage, setImportStage] = useState('upload'); // 'upload', 'detect', 'complete'
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);
    const [importStats, setImportStats] = useState(null);

    // Handle questions received from BulkImport component
    const handleQuestionsUploaded = async (parsedQuestions) => {
        setLoading(true);
        setUploadedQuestions(parsedQuestions);
        setImportStage('detect');
        setLoading(false);
    };

    // Handle duplicate detection completion
    const handleDuplicateProcessingComplete = async (processedQuestions, stats) => {
        try {
            setLoading(true);

            // In a real implementation, we would save to the database here
            const response = await api.post('/questions/bulk', { questions: processedQuestions });

            if (response.data) {
                setImportStats({
                    ...stats,
                    saved: response.data.length
                });
                setImportStage('complete');

                setAlert({
                    type: 'success',
                    message: `Successfully imported ${response.data.length} questions!`
                });
            } else {
                throw new Error('Failed to save questions');
            }
        } catch (error) {
            console.error('Error saving questions:', error);
            setAlert({
                type: 'error',
                message: 'Failed to save questions: ' + error.message
            });
        } finally {
            setLoading(false);
        }
    };

    // Cancel the import process
    const handleCancel = () => {
        setImportStage('upload');
        setUploadedQuestions([]);
    };

    // Reset the import process for a new import
    const handleNewImport = () => {
        setImportStage('upload');
        setUploadedQuestions([]);
        setImportStats(null);
    };

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Import Questions</h2>

            {alert && (
                <Alert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert(null)}
                    className="mb-4"
                />
            )}

            <div className="flex border-b mb-6">
                <button
                    className={`px-4 py-2 ${activeTab === 'bulk' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('bulk')}
                >
                    Bulk Import
                </button>
                <button
                    className={`px-4 py-2 ${activeTab === 'anki' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('anki')}
                >
                    Anki Import
                </button>
                <button
                    className={`px-4 py-2 ${activeTab === 'prite' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('prite')}
                >
                    PRITE Scores
                </button>
            </div>

            {activeTab === 'bulk' && (
                <div>
                    {importStage === 'upload' && (
                        <BulkImport
                            onImport={handleQuestionsUploaded}
                        />
                    )}

                    {importStage === 'detect' && uploadedQuestions.length > 0 && (
                        <DuplicateHandler
                            questions={uploadedQuestions}
                            existingQuestions={questions}
                            onProcessComplete={handleDuplicateProcessingComplete}
                            onCancel={handleCancel}
                        />
                    )}

                    {importStage === 'complete' && importStats && (
                        <div className="card p-6 text-center">
                            <svg className="mx-auto h-16 w-16 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <h3 className="text-xl font-bold my-4">Import Complete!</h3>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 max-w-xl mx-auto">
                                <div className="p-3 bg-gray-100 rounded-lg">
                                    <div className="text-2xl font-bold">{importStats.total}</div>
                                    <div className="text-sm text-gray-600">Total</div>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <div className="text-2xl font-bold">{importStats.duplicates}</div>
                                    <div className="text-sm text-blue-600">Duplicates</div>
                                </div>
                                <div className="p-3 bg-amber-100 rounded-lg">
                                    <div className="text-2xl font-bold">{importStats.merged}</div>
                                    <div className="text-sm text-amber-600">Merged</div>
                                </div>
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <div className="text-2xl font-bold">{importStats.imported}</div>
                                    <div className="text-sm text-green-600">Imported</div>
                                </div>
                            </div>

                            <div className="flex justify-center space-x-4">
                                <button
                                    onClick={handleNewImport}
                                    className="px-4 py-2 bg-primary text-white rounded-md"
                                >
                                    Import More Questions
                                </button>

                                <button
                                    onClick={() => window.location.href = '/browse'}
                                    className="px-4 py-2 border border-primary text-primary rounded-md"
                                >
                                    View Questions
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'anki' && (
                <div className="p-4 bg-white rounded-lg shadow">
                    <h3 className="text-lg font-bold mb-4">Anki Import</h3>
                    <p className="text-gray-600 mb-4">
                        This feature is coming soon. You will be able to import questions from Anki deck files (.apkg).
                    </p>
                    <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                        <p className="mt-2 text-gray-500">Anki Import Feature Coming Soon</p>
                    </div>
                </div>
            )}

            {activeTab === 'prite' && (
                <div className="card p-4">
                    <h3 className="text-lg font-bold mb-4">PRITE Score Integration</h3>
                    <p className="text-gray-600 mb-4">
                        Track your PRITE exam performance and get personalized study recommendations based on your results.
                    </p>

                    <div className="mb-6 bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">Benefits of PRITE Score Tracking</h4>
                        <ul className="list-disc pl-5 space-y-1 text-blue-700">
                            <li>Track your performance over time</li>
                            <li>Compare your scores to expected levels for your PGY level</li>
                            <li>Get personalized study recommendations</li>
                            <li>Focus your study time on areas that need improvement</li>
                            <li>Prepare more effectively for the next PRITE exam</li>
                        </ul>
                    </div>

                    <button
                        onClick={() => window.location.href = '/settings?tab=prite-scores'}
                        className="w-full py-2 bg-primary text-white rounded-md"
                    >
                        Enter PRITE Scores
                    </button>
                </div>
            )}
        </div>
    );
};

/*
 * How the PRITE Score Tracking and Duplicate Detection Systems Work Together
 * 
 * 1. PRITE Score Tracking System:
 *    - Users enter their PRITE scores in Settings > PRITE Scores
 *    - The scores are stored and can be viewed in various visualizations
 *    - The system analyzes score trends and generates personalized study recommendations
 *    - Users can track their progress over time and compare against expected levels
 * 
 * 2. Duplicate Detection System:
 *    - When users import questions (via CSV, manually, or copy-paste), the system scans for duplicates
 *    - The duplicate detection uses string similarity and various heuristics to find potential matches
 *    - Users are presented with a UI to review and resolve duplicates
 *    - Options include merging questions, keeping both, or using newer/metadata
 * 
 * 3. Integration Points:
 *    - The PRITE score analysis highlights study areas to focus on
 *    - The duplicate detection ensures the question database remains clean
 *    - Together, these systems help users build a high-quality study resource targeted to their needs
 *    - Question categories from PRITE analysis can guide which categories to study
 * 
 * 4. Components:
 *    - PriteScoreHistory: Displays and manages PRITE scores
 *    - PriteScoreChart: Visualizes score trends over time
 *    - PritePercentileComparison: Compares scores to expected levels
 *    - PriteRecommendations: Generates study recommendations
 *    - DuplicateHandler: Manages the duplicate detection workflow
 *    - DuplicateResolutionModal: UI for resolving duplicates
 * 
 * 5. Utilities:
 *    - duplicateDetection.js: Core algorithm for finding similar questions
 *    - priteScoreUtils.js: Analysis and recommendation generation for PRITE scores
 *    - bulkImportProcessor.js: Batch processing with duplicate detection
 */

export default ImportPage;