// src/components/study/SessionReview.jsx
import { useState, useContext } from 'react';
import { QuestionContext } from '../../contexts/QuestionContext';
import LoadingSpinner from '../common/LoadingSpinner';
import ExplanationGenerator from '../study/ExplanationGenerator';

const SessionReview = ({ sessionQuestions, onStartNewSession }) => {
    const [reviewIndex, setReviewIndex] = useState(0);
    const { sessionStats } = useContext(QuestionContext);

    // Check if we have questions to review
    if (!sessionQuestions || sessionQuestions.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-lg mb-4">No questions to review</p>
                <button
                    onClick={onStartNewSession}
                    className="btn btn-primary"
                >
                    Start New Session
                </button>
            </div>
        );
    }

    const question = sessionQuestions[reviewIndex];

    // Find user's answer for this question (if any)
    const userAnswer = sessionStats?.answers?.find(a => a.questionId === question._id)?.selectedOption || null;

    // Handle navigation between questions
    const handleNext = () => {
        if (reviewIndex < sessionQuestions.length - 1) {
            setReviewIndex(reviewIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (reviewIndex > 0) {
            setReviewIndex(reviewIndex - 1);
        }
    };

    // Determine if user's answer was correct
    const isCorrect = userAnswer === question.correctAnswer;

    return (
        <div className="pb-20">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Session Review</h2>

                {/* Progress indicator */}
                <div className="text-sm text-gray-600">
                    Question {reviewIndex + 1}/{sessionQuestions.length}
                </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6">
                <div
                    className="bg-primary h-2.5 rounded-full"
                    style={{
                        width: `${((reviewIndex + 1) / sessionQuestions.length) * 100}%`
                    }}
                ></div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary text-white">
                    Part {question.part}
                </span>

                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-success text-white">
                    {question.category || "Uncategorized"}
                </span>

                {question.year && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500 text-white">
                        PRITE {question.year}
                    </span>
                )}
            </div>

            <div className="card">
                <p className="text-lg font-medium mb-6">{question.text}</p>

                <div className="space-y-2 mb-6">
                    {Object.entries(question.options).map(([letter, text]) => {
                        if (!text) return null;

                        let optionClass = "p-3 border rounded-md mb-2";

                        // Highlight correct answer
                        if (letter === question.correctAnswer) {
                            optionClass += " border-success bg-success/10";
                        }
                        // Highlight user's incorrect answer (if any)
                        else if (userAnswer === letter) {
                            optionClass += " border-danger bg-danger/10";
                        }

                        return (
                            <div key={letter} className={optionClass}>
                                <span className="font-bold">{letter}:</span> {text}
                            </div>
                        );
                    })}
                </div>

                <div className={`p-4 my-4 rounded-lg ${isCorrect
                    ? "bg-green-50 border-l-4 border-green-500"
                    : userAnswer
                        ? "bg-red-50 border-l-4 border-red-500"
                        : "bg-blue-50 border-l-4 border-blue-500"
                    }`}>
                    <h4 className="font-bold mb-1">
                        {isCorrect
                            ? "You answered correctly!"
                            : userAnswer
                                ? "Your answer was incorrect"
                                : "This question was not answered"
                        }
                    </h4>

                    <p className="mb-2">
                        {userAnswer ? (
                            <>
                                You selected <span className="font-bold">{userAnswer}</span>.
                                The correct answer is <span className="font-bold">{question.correctAnswer}</span>: {question.options[question.correctAnswer]}
                            </>
                        ) : (
                            <>
                                The correct answer is <span className="font-bold">{question.correctAnswer}</span>: {question.options[question.correctAnswer]}
                            </>
                        )}
                    </p>

                    {question.explanation && (
                        <div className="mt-2">
                            <h4 className="font-bold mb-1">Explanation:</h4>
                            <p>{question.explanation}</p>
                        </div>
                    )}
                </div>

                {/* Add the ExplanationGenerator component right after */}
                <ExplanationGenerator
                    question={question}
                    isVisible={true}
                />
            </div>

            <div className="flex justify-between mt-6">
                <button
                    onClick={handlePrevious}
                    className="btn btn-secondary"
                    disabled={reviewIndex === 0}
                >
                    Previous
                </button>

                {reviewIndex < sessionQuestions.length - 1 ? (
                    <button
                        onClick={handleNext}
                        className="btn btn-primary"
                    >
                        Next
                    </button>
                ) : (
                    <button
                        onClick={onStartNewSession}
                        className="btn btn-primary"
                    >
                        Start New Session
                    </button>
                )}
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                        Review Progress: {reviewIndex + 1} of {sessionQuestions.length} Questions
                    </div>
                    <div className="flex justify-center space-x-1">
                        {sessionQuestions.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setReviewIndex(idx)}
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${idx === reviewIndex
                                        ? 'bg-primary text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                {idx + 1}
                            </button>
                        )).slice(0, 10)}

                        {sessionQuestions.length > 10 && (
                            <span className="text-gray-500 flex items-center">...</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SessionReview;