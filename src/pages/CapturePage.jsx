// src/pages/CapturePage.jsx
import { useState, useContext } from 'react';
import { QuestionContext } from '../contexts/QuestionContext';
import Alert from '../components/common/Alert';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ClaudeInput from '../components/capture/ClaudeInput';
import CategorySelector from '../components/common/CategorySelector';
import api from '../utils/api';
import { PRITE_CATEGORIES } from '../constants/categories';

const CapturePage = () => {
    const [step, setStep] = useState('upload'); // upload, parse, review, complete
    const [ocrText, setOcrText] = useState('');
    const [part, setPart] = useState('1');
    const [year, setYear] = useState(new Date().getFullYear().toString()); // Default to current year
    const [parsedQuestions, setParsedQuestions] = useState([]);
    const [alert, setAlert] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const { addBulkQuestions } = useContext(QuestionContext);

    // Handle processed result from Claude
    const handleClaudeResult = (data, isParsed) => {
        if (isParsed) {
            // If we received pre-parsed JSON data
            try {
                // Ensure the data is an array
                const questionsArray = Array.isArray(data) ? data : [data];

                // Validate and format the questions
                const formattedQuestions = questionsArray.map(q => ({
                    number: q.number || "",
                    text: q.text || "",
                    options: q.options || { A: "", B: "", C: "", D: "", E: "" },
                    correctAnswer: q.correctAnswer || "",
                    explanation: q.explanation || "",
                    category: q.category || "",
                    part: part,
                    year: year,
                    isPublic: false
                }));

                setParsedQuestions(formattedQuestions);
                setStep('review');
            } catch (error) {
                console.error('Error processing JSON data:', error);
                setAlert({
                    type: 'error',
                    message: 'Error processing the JSON data. Please check the format.'
                });
            }
        } else {
            // If we received plain text, go to the parse step
            setOcrText(data);
            setStep('parse');
        }
    };

    // Handle parsing of OCR text
    const handleParse = async () => {
        if (!ocrText.trim()) {
            setAlert({
                type: 'error',
                message: 'Please enter some text to parse'
            });
            return;
        }

        try {
            setIsProcessing(true);

            // Process text with Claude API
            const response = await api.post('/claude', {
                text: ocrText,
                format: 'json'
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
                const parsedResult = typeof result === 'string' ? JSON.parse(result) : result;

                // Ensure we have an array
                const questionsArray = Array.isArray(parsedResult) ? parsedResult : [parsedResult];

                // Format questions with the part number and year
                const formattedQuestions = questionsArray.map(q => ({
                    number: q.number || "",
                    text: q.text || "",
                    options: q.options || { A: "", B: "", C: "", D: "", E: "" },
                    correctAnswer: q.correctAnswer || "",
                    explanation: q.explanation || "",
                    category: "",
                    part: part,
                    year: year,
                    isPublic: false
                }));

                setParsedQuestions(formattedQuestions);
                setStep('review');
            } else {
                throw new Error(response.data?.error || 'Failed to parse questions');
            }
        } catch (error) {
            console.error('Parse error:', error);
            setAlert({
                type: 'error',
                message: `Failed to parse questions: ${error.message}`
            });
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle saving all questions
    const handleSave = async () => {
        // Make sure all questions have the correct part number and year
        const questionsToSave = parsedQuestions.map(q => ({
            ...q,
            part: q.part || part,
            year: q.year || year
        }));

        try {
            setIsProcessing(true);

            const response = await api.post('/questions/bulk', {
                questions: questionsToSave
            });

            if (response.data) {
                setStep('complete');
                setAlert({
                    type: 'success',
                    message: `Successfully saved ${questionsToSave.length} questions!`
                });
            }
        } catch (error) {
            console.error('Save error:', error);
            setAlert({
                type: 'error',
                message: `Failed to save questions: ${error.message}`
            });
        } finally {
            setIsProcessing(false);
        }
    };

    // See if there's a matching answer key for auto-filling answers
    const checkForAnswerKey = (questions) => {
        try {
            // Get stored answer keys from localStorage
            const storedAnswerKeys = JSON.parse(localStorage.getItem('answerKeys') || '[]');

            // Find matching answer key for current part and year
            const matchingKey = storedAnswerKeys.find(key =>
                key.part === part && key.year === year
            );

            if (matchingKey && matchingKey.answers) {
                // Apply answers to questions
                const updatedQuestions = questions.map(question => {
                    const questionNumber = question.number;
                    if (questionNumber && matchingKey.answers[questionNumber]) {
                        return {
                            ...question,
                            correctAnswer: matchingKey.answers[questionNumber]
                        };
                    }
                    return question;
                });

                return updatedQuestions;
            }
        } catch (error) {
            console.error('Error checking for answer key:', error);
        }

        // Return original questions if no matching key or error occurs
        return questions;
    };

    // Upload step
    if (step === 'upload') {
        return (
            <div>
                <h2 className="text-2xl font-bold mb-6">Capture Questions</h2>

                {alert && (
                    <Alert
                        type={alert.type}
                        message={alert.message}
                        onClose={() => setAlert(null)}
                    />
                )}

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">PRITE Part</label>
                        <select
                            value={part}
                            onChange={(e) => setPart(e.target.value)}
                            className="input"
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
                            className="input"
                        >
                            <option value="2024">2024</option>
                            <option value="2023">2023</option>
                            <option value="2022">2022</option>
                            <option value="2021">2021</option>
                            <option value="2020">2020</option>
                        </select>
                    </div>
                </div>

                <ClaudeInput
                    onProcessed={handleClaudeResult}
                    isLoading={isProcessing}
                />
            </div>
        );
    }

    // Parse step
    if (step === 'parse') {
        return (
            <div>
                <h2 className="text-2xl font-bold mb-6">Review Text</h2>

                {alert && (
                    <Alert
                        type={alert.type}
                        message={alert.message}
                        onClose={() => setAlert(null)}
                    />
                )}

                <div className="mb-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">PRITE Part</label>
                            <select
                                value={part}
                                onChange={(e) => setPart(e.target.value)}
                                className="input"
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
                                className="input"
                            >
                                <option value="2024">2024</option>
                                <option value="2023">2023</option>
                                <option value="2022">2022</option>
                                <option value="2021">2021</option>
                                <option value="2020">2020</option>
                            </select>
                        </div>
                    </div>

                    <label className="block text-sm font-medium mb-1 mt-4">Extracted Text</label>
                    <textarea
                        value={ocrText}
                        onChange={(e) => setOcrText(e.target.value)}
                        className="input h-64 mb-4"
                        placeholder="Edit extracted text if needed..."
                        disabled={isProcessing}
                    />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => setStep('upload')}
                        className="btn btn-secondary"
                        disabled={isProcessing}
                    >
                        Back
                    </button>
                    <button
                        onClick={handleParse}
                        className="btn btn-primary"
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <div className="flex items-center justify-center">
                                <LoadingSpinner size="small" />
                                <span className="ml-2">Parsing...</span>
                            </div>
                        ) : (
                            'Parse Questions'
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // Review step
    if (step === 'review' && parsedQuestions.length > 0) {
        // Check for matching answer key when entering review step
        const questionsWithAnswers = checkForAnswerKey(parsedQuestions);

        // Only update state if answers were added
        if (questionsWithAnswers !== parsedQuestions &&
            questionsWithAnswers.some(q => q.correctAnswer !== parsedQuestions.find(pq => pq.number === q.number)?.correctAnswer)) {
            setParsedQuestions(questionsWithAnswers);
        }

        return (
            <div>
                <h2 className="text-2xl font-bold mb-6">
                    Review Questions ({parsedQuestions.length})
                </h2>

                {alert && (
                    <Alert
                        type={alert.type}
                        message={alert.message}
                        onClose={() => setAlert(null)}
                    />
                )}

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">PRITE Part:</label>
                        <div className="p-2 border rounded-md bg-gray-50">{part}</div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">PRITE Year:</label>
                        <div className="p-2 border rounded-md bg-gray-50">{year}</div>
                    </div>
                </div>

                <div className="mb-6 max-h-[calc(100vh-250px)] overflow-y-auto">
                    {parsedQuestions.map((question, index) => (
                        <div key={index} className="card mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <p className="font-medium">Question {question.number || index + 1}</p>
                                {question.correctAnswer && (
                                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                        Answer: {question.correctAnswer}
                                    </span>
                                )}
                            </div>

                            <p className="mb-3">{question.text}</p>

                            <div className="w-full mb-3">
                                <label className="block text-sm font-medium mb-1">
                                    Category
                                </label>
                                <select
                                    value={question.category || ""}
                                    onChange={(e) => {
                                        const updatedQuestions = [...parsedQuestions];
                                        updatedQuestions[index].category = e.target.value;
                                        setParsedQuestions(updatedQuestions);
                                    }}
                                    className="input"
                                >
                                    <option value="">-- Select a category --</option>
                                    {PRITE_CATEGORIES.map(category => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-4">
                                {Object.entries(question.options).map(([letter, text]) => (
                                    text && (
                                        <div
                                            key={letter}
                                            className={`p-3 border rounded-lg mb-2 ${question.correctAnswer === letter
                                                ? 'border-success bg-success/10'
                                                : 'border-gray-300'
                                                }`}
                                            onClick={() => {
                                                // Update the correct answer
                                                const updatedQuestions = [...parsedQuestions];
                                                updatedQuestions[index].correctAnswer = letter;
                                                setParsedQuestions(updatedQuestions);
                                            }}
                                        >
                                            <span className="font-bold">{letter}:</span> {text}
                                        </div>
                                    )
                                ))}
                            </div>

                            <div className="mb-3">
                                <label className="block text-sm font-medium mb-1">
                                    Explanation (optional)
                                </label>
                                <textarea
                                    value={question.explanation || ''}
                                    onChange={(e) => {
                                        const updatedQuestions = [...parsedQuestions];
                                        updatedQuestions[index].explanation = e.target.value;
                                        setParsedQuestions(updatedQuestions);
                                    }}
                                    className="input"
                                    placeholder="Add explanation..."
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="sticky bottom-0 bg-white p-4 border-t flex gap-2">
                    <button
                        onClick={() => setStep(parsedQuestions[0].text ? 'upload' : 'parse')}
                        className="btn btn-secondary flex-1"
                        disabled={isProcessing}
                    >
                        Back
                    </button>
                    <button
                        onClick={handleSave}
                        className="btn btn-primary flex-1"
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <div className="flex items-center justify-center">
                                <LoadingSpinner size="small" />
                                <span className="ml-2">Saving...</span>
                            </div>
                        ) : (
                            'Save All'
                        )}
                    </button>
                </div>
            </div>
        );
    }

    // Complete step
    if (step === 'complete') {
        return (
            <div className="text-center py-8">
                <svg className="mx-auto h-16 w-16 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <h2 className="text-2xl font-bold my-4">Questions Saved!</h2>
                <p className="mb-6">Your questions for PRITE {year} Part {part} have been added to your collection.</p>

                {alert && (
                    <Alert
                        type={alert.type}
                        message={alert.message}
                        onClose={() => setAlert(null)}
                    />
                )}

                <button
                    onClick={() => {
                        setStep('upload');
                        setOcrText('');
                        setParsedQuestions([]);
                    }}
                    className="btn btn-primary w-full"
                >
                    Add More Questions
                </button>
            </div>
        );
    }

    // Fallback for empty review
    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">No Questions Found</h2>
            <p className="mb-4">No questions were detected in the text.</p>
            <button
                onClick={() => setStep('parse')}
                className="btn btn-primary"
            >
                Try Again
            </button>
        </div>
    );
};

export default CapturePage;