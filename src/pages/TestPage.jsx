// src/pages/TestPage.jsx
import { useState } from 'react';
import QuestionReview from '../components/capture/QuestionReview';
import AnswerKeyProcessor from '../components/capture/AnswerKeyProcessor';
import api from '../utils/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const TestPage = () => {
    const [activeTab, setActiveTab] = useState('questions'); // 'questions' or 'answers'
    const [inputText, setInputText] = useState("");
    const [part, setPart] = useState("1");
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [parsedQuestions, setParsedQuestions] = useState([]);
    const [stage, setStage] = useState('input'); // 'input', 'review', 'complete'

    const currentYear = new Date().getFullYear();

    const handleTest = async () => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            console.log("Testing Claude API with text:", inputText);

            const response = await api.post('/claude', {
                text: inputText,
                format: 'json'
            });

            console.log("Claude API response:", response);
            const data = response.data;

            if (data.success) {
                const jsonData = data.data;
                setResult(jsonData);

                // Parse the JSON result, cleaning markdown formatting if needed
                try {
                    let cleanJson = jsonData;

                    // Remove markdown code blocks if present (```json and ```)
                    if (typeof jsonData === 'string') {
                        cleanJson = jsonData
                            .replace(/```json\s*/g, '')  // Remove opening ```json
                            .replace(/```\s*$/g, '')     // Remove closing ```
                            .trim();                     // Trim any extra whitespace
                    }

                    const questions = typeof cleanJson === 'string'
                        ? JSON.parse(cleanJson)
                        : cleanJson;

                    // Ensure we have an array of questions
                    const questionsArray = Array.isArray(questions) ? questions : [questions];

                    // Add part and year to each question
                    const formattedQuestions = questionsArray.map(q => ({
                        ...q,
                        part: part,
                        year: year
                    }));

                    setParsedQuestions(formattedQuestions);
                    setStage('review');
                } catch (jsonError) {
                    console.error("JSON parsing error:", jsonError);
                    console.error("Raw data:", jsonData);
                    setError(`Failed to parse questions from response: ${jsonError.message}`);
                }
            } else {
                setError(data.error || "Unknown error");
            }
        } catch (err) {
            console.error("Test failed:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveQuestions = async (questions) => {
        try {
            setLoading(true);

            // Add part field if missing
            const questionsToSave = questions.map(q => ({
                ...q,
                part: q.part || part,
                year: q.year || year
            }));

            console.log("Saving questions:", questionsToSave);

            // Make the actual API call to save questions
            const response = await api.post('/questions/bulk', {
                questions: questionsToSave
            });

            console.log("Questions saved successfully:", response.data);
            setStage('complete');
        } catch (err) {
            console.error("Save failed:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Main component render
    return (
        <div className="max-w-4xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">PRITE Study Tool</h1>

            <div className="flex border-b mb-6">
                <button
                    className={`px-4 py-2 ${activeTab === 'questions' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('questions')}
                >
                    Parse Questions
                </button>
                <button
                    className={`px-4 py-2 ${activeTab === 'answers' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('answers')}
                >
                    Process Answer Key
                </button>
            </div>

            {activeTab === 'questions' ? (
                // Question parsing content
                <>
                    {stage === 'input' && (
                        <div className="p-4 bg-white rounded-lg shadow mb-8">
                            <h2 className="text-xl font-bold mb-4">Parse PRITE Questions</h2>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">PRITE Part:</label>
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
                                    <label className="block text-sm font-medium mb-1">PRITE Year:</label>
                                    <select
                                        value={year}
                                        onChange={(e) => setYear(e.target.value)}
                                        className="w-full p-2 border rounded-md"
                                    >
                                        {[0, 1, 2, 3, 4].map(offset => {
                                            const yearOption = (currentYear - offset).toString();
                                            return (
                                                <option key={yearOption} value={yearOption}>
                                                    {yearOption}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Paste PRITE Questions:</label>
                                <textarea
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    className="w-full p-2 border rounded-md"
                                    rows="12"
                                    placeholder="Paste your PRITE questions here..."
                                />
                            </div>

                            <button
                                onClick={handleTest}
                                disabled={loading || !inputText.trim()}
                                className="px-4 py-2 bg-blue-500 text-white rounded-md w-full flex justify-center items-center"
                            >
                                {loading ? (
                                    <>
                                        <LoadingSpinner size="small" />
                                        <span className="ml-2">Processing...</span>
                                    </>
                                ) : (
                                    "Parse Questions"
                                )}
                            </button>

                            {error && (
                                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                                    Error: {error}
                                </div>
                            )}
                        </div>
                    )}

                    {stage === 'review' && (
                        <div>
                            <h2 className="text-2xl font-bold mb-6">Review PRITE Questions</h2>

                            <QuestionReview
                                questions={parsedQuestions}
                                onSave={handleSaveQuestions}
                                onCancel={() => setStage('input')}
                            />

                            {error && (
                                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                                    Error: {error}
                                </div>
                            )}
                        </div>
                    )}

                    {stage === 'complete' && (
                        <div className="text-center">
                            <h2 className="text-2xl font-bold mb-6">Questions Saved!</h2>

                            <div className="p-8 bg-white rounded-lg shadow mb-8">
                                <svg className="w-20 h-20 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>

                                <p className="text-lg mb-2">Your PRITE {year} Part {part} questions have been saved successfully!</p>

                                <div className="flex justify-center gap-4 mt-6">
                                    <button
                                        onClick={() => {
                                            setInputText('');
                                            setParsedQuestions([]);
                                            setResult(null);
                                            setStage('input');
                                        }}
                                        className="px-4 py-2 bg-blue-500 text-white rounded-md"
                                    >
                                        Add More Questions
                                    </button>

                                    <button
                                        onClick={() => {
                                            // This would typically navigate to your study page
                                            window.location.href = '/study';
                                        }}
                                        className="px-4 py-2 border border-blue-500 text-blue-500 rounded-md"
                                    >
                                        Start Studying
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                // Answer key processing tab
                <AnswerKeyProcessor />
            )}
        </div>
    );
};

export default TestPage;