// src/components/import/AnswerKeyUpload.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import api from '../../utils/api';
import Alert from '../common/Alert';
import LoadingSpinner from '../common/LoadingSpinner';

const AnswerKeyUpload = () => {
    const [answerText, setAnswerText] = useState('');
    const [part, setPart] = useState('1');
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);
    const [step, setStep] = useState(1);
    const [parsedAnswers, setParsedAnswers] = useState({});
    const [affectedQuestions, setAffectedQuestions] = useState([]);
    const navigate = useNavigate();

    // Parse the answer key text
    const parseAnswerKey = async () => {
        try {
            setLoading(true);

            if (!answerText.trim()) {
                setAlert({
                    type: 'error',
                    message: 'Please enter the answer key text'
                });
                return;
            }

            // First try the Claude API for parsing
            const answers = await processWithClaude();

            if (!answers || Object.keys(answers).length === 0) {
                // If Claude fails or no answers are found, fall back to local parsing
                const answers = parseAnswersLocally();

                if (Object.keys(answers).length === 0) {
                    throw new Error('Could not parse any answers from the provided text');
                }
            }

            // Find questions that will be affected by this answer key
            const response = await api.post('/questions/findByPartYear', {
                part,
                year
            });

            if (response.data && response.data.questions) {
                setAffectedQuestions(response.data.questions);
            }

            setParsedAnswers(answers);
            setStep(2);
        } catch (error) {
            console.error('Error parsing answer key:', error);
            setAlert({
                type: 'error',
                message: error.message || 'Failed to parse answer key'
            });
        } finally {
            setLoading(false);
        }
    };

    // Process answer key with Claude
    const processWithClaude = async () => {
        try {
            const response = await api.post('/claude', {
                text: answerText,
                format: 'json',
                prompt: `Extract PRITE exam answers from this table of answers. Return a JSON object where the keys are question numbers and the values are the answer letters (A, B, C, D, or E).
                Example output: {"1":"B","2":"A","3":"C"}
                Here is the answer key text:
                ${answerText}`
            });

            if (response.data && response.data.success) {
                let result = response.data.data;

                // Clean up JSON if it's a string with markdown
                if (typeof result === 'string') {
                    result = result
                        .replace(/```json\s*/g, '')
                        .replace(/```\s*$/g, '')
                        .trim();
                }

                // Parse JSON if needed
                const answers = typeof result === 'string' ? JSON.parse(result) : result;

                return answers;
            }

            return null;
        } catch (error) {
            console.error('Claude API error:', error);
            return null;
        }
    };

    // Local fallback for parsing answer keys
    const parseAnswersLocally = () => {
        const answers = {};

        // Try different formats

        // Format 1: Simple "Number Letter" format (e.g., "1 A, 2 B, 3 C")
        const simpleFormat = /(\d+)[\s\.]+([A-E])/g;
        let match;

        while ((match = simpleFormat.exec(answerText)) !== null) {
            const number = match[1];
            const answer = match[2];
            answers[number] = answer;
        }

        // Format 2: Table format with columns
        if (Object.keys(answers).length === 0) {
            // Try parsing as CSV
            const rows = answerText.split('\n');

            // Look for rows with number + letter pattern
            rows.forEach(row => {
                const rowMatch = row.match(/(\d+)[\s\t,;:]+([A-E])/);
                if (rowMatch) {
                    answers[rowMatch[1]] = rowMatch[2];
                }
            });
        }

        return answers;
    };

    // Apply the answers to questions
    const applyAnswers = async () => {
        try {
            setLoading(true);

            // Update questions with the parsed answers
            const response = await api.post('/questions/bulkUpdateAnswers', {
                answers: parsedAnswers,
                part,
                year
            });

            if (response.data && response.data.success) {
                setAlert({
                    type: 'success',
                    message: `Successfully updated ${response.data.updatedCount} questions with answers`
                });

                setStep(3);
            } else {
                throw new Error(response.data?.message || 'Failed to update questions');
            }
        } catch (error) {
            console.error('Error applying answers:', error);
            setAlert({
                type: 'error',
                message: error.message || 'Failed to apply answers to questions'
            });
        } finally {
            setLoading(false);
        }
    };

    // Render based on current step
    if (step === 1) {
        return (
            <div className="p-4 bg-white rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Upload Answer Key</h2>

                {alert && (
                    <Alert
                        type={alert.type}
                        message={alert.message}
                        onClose={() => setAlert(null)}
                        className="mb-4"
                    />
                )}

                <div className="mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">PRITE Part</label>
                            <select
                                value={part}
                                onChange={(e) => setPart(e.target.value)}
                                className="w-full p-2 border rounded-md"
                            >
                                <option value="1">Part 1</option>
                                <option value="2">Part 2</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">PRITE Year</label>
                            <select
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                className="w-full p-2 border rounded-md"
                            >
                                <option value="2024">2024</option>
                                <option value="2023">2023</option>
                                <option value="2022">2022</option>
                                <option value="2021">2021</option>
                                <option value="2020">2020</option>
                            </select>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                            Paste Answer Key Text:
                        </label>
                        <textarea
                            value={answerText}
                            onChange={(e) => setAnswerText(e.target.value)}
                            className="w-full p-2 border rounded-md"
                            rows="10"
                            placeholder="Paste the answer key text here. For example:
1. A
2. B
3. C
..."
                        />
                    </div>

                    <button
                        onClick={parseAnswerKey}
                        disabled={loading || !answerText.trim()}
                        className="w-full p-2 bg-primary text-white rounded-md flex justify-center items-center"
                    >
                        {loading ? (
                            <>
                                <LoadingSpinner size="small" className="mr-2" />
                                Processing...
                            </>
                        ) : (
                            'Parse Answer Key'
                        )}
                    </button>
                </div>

                <div className="text-sm text-gray-600">
                    <p className="font-medium mb-1">Supported Formats:</p>
                    <ul className="list-disc list-inside">
                        <li>Simple list: "1. A, 2. B, 3. C"</li>
                        <li>Table format with question numbers and answers</li>
                        <li>CSV or tab-separated values</li>
                    </ul>
                </div>
            </div>
        );
    }

    if (step === 2) {
        const answerCount = Object.keys(parsedAnswers).length;

        return (
            <div className="p-4 bg-white rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Review Parsed Answers</h2>

                {alert && (
                    <Alert
                        type={alert.type}
                        message={alert.message}
                        onClose={() => setAlert(null)}
                        className="mb-4"
                    />
                )}

                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">Detected Answers</h3>
                        <span className="text-sm text-gray-600">{answerCount} answers found</span>
                    </div>

                    <div className="border rounded-md p-4 max-h-60 overflow-y-auto">
                        <div className="grid grid-cols-5 gap-2">
                            {Object.entries(parsedAnswers).map(([number, answer]) => (
                                <div key={number} className="text-center p-2 border rounded-md">
                                    <div className="text-xs text-gray-500">Q{number}</div>
                                    <div className="font-medium text-lg">{answer}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium">Affected Questions</h3>
                        <span className="text-sm text-gray-600">{affectedQuestions.length} questions will be updated</span>
                    </div>

                    {affectedQuestions.length > 0 ? (
                        <div className="bg-blue-50 p-3 rounded-md text-blue-800 text-sm">
                            <p>The answer key will be applied to {affectedQuestions.length} questions from PRITE {year} Part {part}.</p>
                        </div>
                    ) : (
                        <div className="bg-yellow-50 p-3 rounded-md text-yellow-800 text-sm">
                            <p>No questions found for PRITE {year} Part {part}. Please upload questions first before applying the answer key.</p>
                        </div>
                    )}
                </div>

                <div className="flex justify-between mt-6">
                    <button
                        onClick={() => setStep(1)}
                        className="px-4 py-2 border rounded-md"
                        disabled={loading}
                    >
                        Back
                    </button>

                    <button
                        onClick={applyAnswers}
                        disabled={loading || affectedQuestions.length === 0}
                        className="px-4 py-2 bg-green-500 text-white rounded-md flex items-center"
                    >
                        {loading ? (
                            <>
                                <LoadingSpinner size="small" className="mr-2" />
                                Applying Answers...
                            </>
                        ) : (
                            'Apply Answers'
                        )}
                    </button>
                </div>
            </div>
        );
    }

    if (step === 3) {
        return (
            <div className="p-4 bg-white rounded-lg shadow text-center">
                <svg className="mx-auto h-16 w-16 text-green-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>

                <h2 className="text-xl font-bold mb-4">Answers Applied!</h2>

                {alert && (
                    <Alert
                        type={alert.type}
                        message={alert.message}
                        onClose={() => setAlert(null)}
                        className="mb-4"
                    />
                )}

                <p className="mb-6">
                    The answer key for PRITE {year} Part {part} has been successfully applied to your questions.
                </p>

                <div className="flex justify-center space-x-4">
                    <button
                        onClick={() => {
                            setAnswerText('');
                            setParsedAnswers({});
                            setAffectedQuestions([]);
                            setStep(1);
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md"
                    >
                        Upload Another Answer Key
                    </button>

                    <button
                        onClick={() => navigate('/browse')}
                        className="px-4 py-2 border border-blue-500 text-blue-500 rounded-md"
                    >
                        View Questions
                    </button>
                </div>
            </div>
        );
    }

    return null;
};

export default AnswerKeyUpload;