// src/components/browse/QuestionEditModal.jsx
import { useState, useEffect } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import Alert from '../common/Alert';
import api from '../../utils/api';
import { PRITE_CATEGORIES } from '../../constants/categories';

const QuestionEditModal = ({ question, onClose, onUpdate }) => {
    const [formData, setFormData] = useState({
        text: question.text || '',
        options: {
            A: question.options?.A || '',
            B: question.options?.B || '',
            C: question.options?.C || '',
            D: question.options?.D || '',
            E: question.options?.E || '',
            F: question.options?.F || '',
            G: question.options?.G || '',
            H: question.options?.H || '',
            I: question.options?.I || '',
            J: question.options?.J || '',
            K: question.options?.K || '',
            L: question.options?.L || '',
            M: question.options?.M || '',
            N: question.options?.N || '',
            O: question.options?.O || ''
        },
        correctAnswer: question.correctAnswer || '',
        correctAnswers: question.correctAnswers || [],
        explanation: question.explanation || '',
        category: question.category || '',
        part: question.part || '1',
        year: question.year || new Date().getFullYear().toString(),
        isPublic: question.isPublic || false,
        number: question.number || '',
        questionType: question.questionType || 'standard',
        instructions: question.instructions || '',
        numCorrectAnswers: question.numCorrectAnswers || 1
    });
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState(null);
    const [visibleOptions, setVisibleOptions] = useState(5); // Default to 5 options (A-E)

    // Update visible options when question type changes
    useEffect(() => {
        if (formData.questionType === 'fourOptions') {
            setVisibleOptions(4);
        } else if (formData.questionType === 'multipleCorrect') {
            setVisibleOptions(15); // Show all possible options for multiple correct
        } else {
            setVisibleOptions(5); // Standard questions show 5 options
        }
    }, [formData.questionType]);

    // Handle form changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (type === 'checkbox') {
            if (name === 'isPublic') {
                setFormData(prev => ({
                    ...prev,
                    [name]: checked
                }));
            } else if (name.startsWith('correctAnswer_')) {
                // Handle multiple correct answers checkboxes
                const letter = name.split('_')[1];
                const updatedCorrectAnswers = [...formData.correctAnswers];

                if (checked) {
                    if (!updatedCorrectAnswers.includes(letter)) {
                        updatedCorrectAnswers.push(letter);
                    }
                } else {
                    const index = updatedCorrectAnswers.indexOf(letter);
                    if (index !== -1) {
                        updatedCorrectAnswers.splice(index, 1);
                    }
                }

                setFormData(prev => ({
                    ...prev,
                    correctAnswers: updatedCorrectAnswers
                }));
            }
        } else if (name === 'questionType') {
            // Set default instructions based on question type
            let instructions = '';
            if (value === 'multipleCorrect') {
                instructions = 'Select the THREE correct answers.';
            }

            // Reset correctAnswer/correctAnswers based on question type
            setFormData(prev => ({
                ...prev,
                [name]: value,
                instructions: instructions,
                correctAnswer: value === 'multipleCorrect' ? '' : prev.correctAnswer,
                correctAnswers: value === 'multipleCorrect' ? [] : prev.correctAnswers,
                numCorrectAnswers: value === 'multipleCorrect' ? 3 : 1
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    // Handle option changes
    const handleOptionChange = (letter, value) => {
        setFormData(prev => ({
            ...prev,
            options: {
                ...prev.options,
                [letter]: value
            }
        }));
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);

            // Validate the form
            if (!formData.text) {
                setAlert({
                    type: 'error',
                    message: 'Question text is required'
                });
                return;
            }

            if (!formData.options.A || !formData.options.B) {
                setAlert({
                    type: 'error',
                    message: 'At least options A and B are required'
                });
                return;
            }

            // Validate based on question type
            if (formData.questionType === 'standard' || formData.questionType === 'fourOptions') {
                if (!formData.correctAnswer) {
                    setAlert({
                        type: 'error',
                        message: 'Please select a correct answer'
                    });
                    return;
                }
            } else if (formData.questionType === 'multipleCorrect') {
                if (formData.correctAnswers.length === 0) {
                    setAlert({
                        type: 'error',
                        message: 'Please select at least one correct answer'
                    });
                    return;
                }

                if (formData.numCorrectAnswers > 0 && formData.correctAnswers.length !== parseInt(formData.numCorrectAnswers)) {
                    setAlert({
                        type: 'warning',
                        message: `You've selected ${formData.correctAnswers.length} answers, but specified ${formData.numCorrectAnswers} correct answers`
                    });
                    // Continue anyway - this is just a warning
                }
            }

            // Submit the form
            const response = await api.put(`/questions/${question._id}`, formData);

            if (response.data) {
                setAlert({
                    type: 'success',
                    message: 'Question updated successfully'
                });

                // Wait a moment then close and update
                setTimeout(() => {
                    if (onUpdate) {
                        onUpdate(response.data);
                    }
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

    // Get the letters for options based on visible options count
    const getOptionLetters = () => {
        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O'];
        return letters.slice(0, visibleOptions);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white p-4 border-b z-10 flex justify-between items-center">
                    <h2 className="text-lg font-bold">Edit Question</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
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

                <form onSubmit={handleSubmit} className="p-4">
                    {/* Question Info Section */}
                    <div className="mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Part</label>
                                <select
                                    name="part"
                                    value={formData.part}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="1">Part 1</option>
                                    <option value="2">Part 2</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Year</label>
                                <select
                                    name="year"
                                    value={formData.year}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                >
                                    {[0, 1, 2, 3, 4].map(offset => {
                                        const year = (new Date().getFullYear() - offset).toString();
                                        return (
                                            <option key={year} value={year}>{year}</option>
                                        );
                                    })}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Question Number</label>
                                <input
                                    type="text"
                                    name="number"
                                    value={formData.number}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                    placeholder="e.g., 25"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Category</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="">Select Category</option>
                                    {PRITE_CATEGORIES && PRITE_CATEGORIES.map(category => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Question Type Selector */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Question Type</label>
                            <select
                                name="questionType"
                                value={formData.questionType}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-md"
                            >
                                <option value="standard">Standard (5 options, 1 correct)</option>
                                <option value="fourOptions">Four Options (4 options, 1 correct)</option>
                                <option value="multipleCorrect">Multiple Correct (Choose 3)</option>
                            </select>
                        </div>

                        {/* Instructions field for special question types */}
                        {formData.questionType !== 'standard' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Instructions</label>
                                <input
                                    type="text"
                                    name="instructions"
                                    value={formData.instructions}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                    placeholder="Special instructions for this question"
                                />
                            </div>
                        )}

                        {/* Number of correct answers for multipleCorrect type */}
                        {formData.questionType === 'multipleCorrect' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Number of Correct Answers</label>
                                <input
                                    type="number"
                                    name="numCorrectAnswers"
                                    value={formData.numCorrectAnswers}
                                    onChange={handleChange}
                                    min="1"
                                    max="15"
                                    className="w-full p-2 border rounded-md"
                                />
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Question Text</label>
                            <textarea
                                name="text"
                                value={formData.text}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-md"
                                rows="4"
                                placeholder="Enter the question text"
                                required
                            />
                        </div>
                    </div>

                    {/* Options Section */}
                    <div className="mb-6">
                        <h3 className="font-bold mb-2">Options</h3>

                        {getOptionLetters().map(letter => (
                            <div key={letter} className="mb-3">
                                <label className="block text-sm font-medium mb-1">
                                    Option {letter}{letter === 'A' || letter === 'B' ? ' *' : ''}
                                </label>
                                <div className="flex">
                                    <div className="w-10 h-10 flex items-center justify-center bg-gray-100 border border-r-0 rounded-l-md">
                                        {letter}
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.options[letter] || ''}
                                        onChange={(e) => handleOptionChange(letter, e.target.value)}
                                        className="flex-grow p-2 border rounded-r-md"
                                        placeholder={`Enter option ${letter}`}
                                        required={letter === 'A' || letter === 'B'}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Correct Answer & Explanation */}
                    <div className="mb-6">
                        <h3 className="font-bold mb-2">Answer & Explanation</h3>

                        {/* For standard and fourOptions types - single correct answer */}
                        {(formData.questionType === 'standard' || formData.questionType === 'fourOptions') && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">Correct Answer</label>
                                <select
                                    name="correctAnswer"
                                    value={formData.correctAnswer}
                                    onChange={handleChange}
                                    className="w-full p-2 border rounded-md"
                                >
                                    <option value="">Select Correct Answer</option>
                                    {getOptionLetters().map(letter => (
                                        formData.options[letter] && (
                                            <option key={letter} value={letter}>
                                                {letter}: {formData.options[letter].substring(0, 40)}...
                                            </option>
                                        )
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* For multipleCorrect type - multiple correct answers */}
                        {formData.questionType === 'multipleCorrect' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1">
                                    Correct Answers (Select {formData.numCorrectAnswers})
                                </label>
                                <div className="space-y-2 border p-3 rounded-md">
                                    {getOptionLetters().map(letter => (
                                        formData.options[letter] && (
                                            <div key={letter} className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id={`correctAnswer_${letter}`}
                                                    name={`correctAnswer_${letter}`}
                                                    checked={formData.correctAnswers.includes(letter)}
                                                    onChange={handleChange}
                                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                                />
                                                <label htmlFor={`correctAnswer_${letter}`} className="ml-2 text-sm text-gray-900">
                                                    {letter}: {formData.options[letter].substring(0, 40)}...
                                                </label>
                                            </div>
                                        )
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Selected: {formData.correctAnswers.join(', ')}
                                    ({formData.correctAnswers.length}/{formData.numCorrectAnswers})
                                </p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-1">Explanation</label>
                            <textarea
                                name="explanation"
                                value={formData.explanation}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-md"
                                rows="3"
                                placeholder="Enter explanation (optional)"
                            />
                        </div>
                    </div>

                    {/* Visibility */}
                    <div className="mb-6">
                        <h3 className="font-bold mb-2">Visibility</h3>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="isPublic"
                                name="isPublic"
                                checked={formData.isPublic}
                                onChange={handleChange}
                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                            <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
                                Make this question public
                            </label>
                        </div>

                        <p className="text-xs text-gray-500 mt-1">
                            Public questions can be viewed and studied by all users. Your username will be shown as the contributor.
                        </p>
                    </div>

                    {/* Submission Buttons */}
                    <div className="flex justify-end space-x-2 border-t pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded-md"
                            disabled={loading}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
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
                </form>
            </div>
        </div>
    );
};

export default QuestionEditModal;