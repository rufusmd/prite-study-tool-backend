// src/components/capture/QuestionReview.jsx
import { useState, useEffect } from 'react';
import { PRITE_CATEGORIES } from '../../constants/categories';
import LoadingSpinner from '../common/LoadingSpinner';

const QuestionReview = ({ questions, onSave, onCancel }) => {
    const [reviewQuestions, setReviewQuestions] = useState([]);
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const currentYear = new Date().getFullYear();

    // Initialize review questions when the component mounts or questions change
    useEffect(() => {
        // Set default values for empty fields
        const formattedQuestions = questions.map(q => ({
            ...q,
            correctAnswer: q.correctAnswer || '',
            explanation: q.explanation || '',
            category: q.category || '',
            year: q.year || year
        }));

        setReviewQuestions(formattedQuestions);
    }, [questions, year]);

    // Check if an answer key exists for the current year
    useEffect(() => {
        try {
            // Get stored answer keys from localStorage
            const storedAnswerKeys = JSON.parse(localStorage.getItem('answerKeys') || '[]');

            // Get part from the first question (assuming all questions are from the same part)
            const part = reviewQuestions.length > 0 ? reviewQuestions[0].part : '1';

            // Find matching answer key for current part and year
            const matchingKey = storedAnswerKeys.find(key =>
                key.part === part && key.year === year
            );

            if (matchingKey && matchingKey.answers) {
                // Apply answers to questions if user confirms
                const hasExistingAnswers = reviewQuestions.some(q => q.correctAnswer);

                if (!hasExistingAnswers || window.confirm(`Answer key found for PRITE ${year} Part ${part}. Apply these answers to your questions?`)) {
                    const updatedQuestions = reviewQuestions.map(question => {
                        const questionNumber = question.number;
                        if (questionNumber && matchingKey.answers[questionNumber]) {
                            return {
                                ...question,
                                correctAnswer: matchingKey.answers[questionNumber]
                            };
                        }
                        return question;
                    });

                    setReviewQuestions(updatedQuestions);
                }
            }
        } catch (error) {
            console.error('Error checking for answer key:', error);
        }
    }, [year]);

    // Handle selecting a correct answer for a question
    const handleSelectAnswer = (questionIndex, option) => {
        const updatedQuestions = [...reviewQuestions];
        updatedQuestions[questionIndex].correctAnswer = option;
        setReviewQuestions(updatedQuestions);
    };

    // Handle updating explanation
    const handleExplanationChange = (questionIndex, explanation) => {
        const updatedQuestions = [...reviewQuestions];
        updatedQuestions[questionIndex].explanation = explanation;
        setReviewQuestions(updatedQuestions);
    };

    // Handle updating category
    const handleCategoryChange = (questionIndex, category) => {
        const updatedQuestions = [...reviewQuestions];
        updatedQuestions[questionIndex].category = category;
        setReviewQuestions(updatedQuestions);
    };

    // Handle updating year for all questions
    const handleYearChange = (newYear) => {
        setYear(newYear);

        // Update year for all questions
        const updatedQuestions = reviewQuestions.map(q => ({
            ...q,
            year: newYear
        }));

        setReviewQuestions(updatedQuestions);
    };

    // Calculate how many questions have selected answers
    const answeredCount = reviewQuestions.filter(q => q.correctAnswer).length;

    return (
        <div className="question-review">
            <h2 className="text-xl font-bold mb-4">
                Review Questions ({answeredCount}/{reviewQuestions.length} answered)
            </h2>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">PRITE Year:</label>
                <select
                    value={year}
                    onChange={(e) => handleYearChange(e.target.value)}
                    className="w-full p-2 border rounded-md mb-4"
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

            <div className="max-h-[70vh] overflow-y-auto pr-2">
                {reviewQuestions.map((question, qIndex) => (
                    <div key={qIndex} className="card mb-4 p-4">
                        <div className="flex justify-between items-center mb-2">
                            <div className="font-medium">Question {question.number || qIndex + 1}</div>
                            <div className="text-sm text-gray-500">
                                Part {question.part} • {question.year}
                            </div>
                        </div>

                        <div className="mb-4">{question.text}</div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">
                                Category:
                            </label>
                            <select
                                value={question.category}
                                onChange={(e) => handleCategoryChange(qIndex, e.target.value)}
                                className="w-full p-2 border rounded-md mb-4"
                            >
                                <option value="">-- Select a category --</option>
                                {PRITE_CATEGORIES.map((category) => (
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
                                        className={`p-3 border rounded-md mb-2 cursor-pointer ${letter === question.correctAnswer
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-gray-300 hover:bg-gray-50'
                                            }`}
                                        onClick={() => handleSelectAnswer(qIndex, letter)}
                                    >
                                        <span className="font-bold">{letter}:</span> {text}
                                    </div>
                                )
                            ))}
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Explanation (optional):
                            </label>
                            <textarea
                                value={question.explanation}
                                onChange={(e) => handleExplanationChange(qIndex, e.target.value)}
                                className="w-full p-2 border rounded-md"
                                placeholder="Add an explanation for this question..."
                                rows="3"
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-between mt-6">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 border rounded-md"
                >
                    Back
                </button>
                <button
                    onClick={() => onSave(reviewQuestions)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md"
                    disabled={answeredCount === 0}
                >
                    {answeredCount === 0
                        ? 'Select at least one answer'
                        : `Save ${answeredCount} Questions`}
                </button>
            </div>
        </div>
    );
};

export default QuestionReview;