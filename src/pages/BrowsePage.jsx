// src/pages/BrowsePage.jsx
import { useState, useEffect, useContext } from 'react';
import { QuestionContext } from '../contexts/QuestionContext';
import { AuthContext } from '../contexts/AuthContext';
import { questionApi } from '../api';
import Alert from '../components/common/Alert';
// Inline loading spinner component
const LoadingSpinner = ({ size = 'medium' }) => {
    const sizeClasses = {
        small: 'h-4 w-4 border-2',
        medium: 'h-8 w-8 border-2',
        large: 'h-12 w-12 border-3'
    };
    return (
        <div className={`animate-spin rounded-full border-solid border-primary border-t-transparent ${sizeClasses[size]}`}></div>
    );
};
import QuestionEditModal from '../components/browse/QuestionEditModal';

const BrowsePage = () => {
    const { user } = useContext(AuthContext);
    const { questions, dueQuestions, loading, loadQuestions } = useContext(QuestionContext);
    const [filteredQuestions, setFilteredQuestions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        part: '',
        category: '',
        visibility: 'all'
    });
    const [alert, setAlert] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [editQuestion, setEditQuestion] = useState(null);

    // Set filtered questions on component mount
    useEffect(() => {
        setFilteredQuestions(questions);
    }, [questions]);

    // Get unique categories from questions
    const categories = [...new Set(questions.filter(q => q.category).map(q => q.category))];

    // Handle search
    const handleSearch = async () => {
        setIsSearching(true);

        try {
            const params = {
                text: searchQuery,
                ...filters
            };

            const response = await questionApi.searchQuestions(params);

            if (response.success) {
                setFilteredQuestions(response.data);
            } else {
                setAlert({
                    type: 'error',
                    message: response.error || 'Search failed'
                });
            }
        } catch (error) {
            setAlert({
                type: 'error',
                message: 'An error occurred while searching'
            });
        } finally {
            setIsSearching(false);
        }
    };

    // Update filter
    const updateFilter = (name, value) => {
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle edit question click
    const handleEditQuestion = (question) => {
        setEditQuestion(question);
    };

    // Handle update question after edit
    const handleQuestionUpdate = (updatedQuestion) => {
        // Update the question in the filtered questions list
        setFilteredQuestions(prev =>
            prev.map(q => q._id === updatedQuestion._id ? updatedQuestion : q)
        );

        // Refresh all questions to ensure consistency
        loadQuestions();

        setAlert({
            type: 'success',
            message: 'Question updated successfully'
        });
    };

    // Determine if user can edit the question
    const canEditQuestion = (question) => {
        return user && question.creator === user.id;
    };

    if (loading && !isSearching) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="pb-20">
            <h2 className="text-2xl font-bold mb-6">Browse Questions</h2>

            {alert && (
                <Alert
                    type={alert.type}
                    message={alert.message}
                    onClose={() => setAlert(null)}
                />
            )}

            <div className="card mb-6">
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Search</label>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search questions..."
                        className="input w-full"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Part</label>
                        <select
                            value={filters.part}
                            onChange={(e) => updateFilter('part', e.target.value)}
                            className="input w-full"
                        >
                            <option value="">All Parts</option>
                            <option value="1">Part 1</option>
                            <option value="2">Part 2</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Category</label>
                        <select
                            value={filters.category}
                            onChange={(e) => updateFilter('category', e.target.value)}
                            className="input w-full"
                        >
                            <option value="">All Categories</option>
                            {categories.map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Visibility</label>
                        <select
                            value={filters.visibility}
                            onChange={(e) => updateFilter('visibility', e.target.value)}
                            className="input w-full"
                        >
                            <option value="all">All Questions</option>
                            <option value="mine">My Questions</option>
                            <option value="public">Public Questions</option>
                        </select>
                    </div>
                </div>

                <button
                    onClick={handleSearch}
                    className="btn btn-primary w-full flex justify-center items-center"
                    disabled={isSearching}
                >
                    {isSearching ? <LoadingSpinner size="small" /> : 'Search'}
                </button>
            </div>

            <div className="mb-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold">Results ({filteredQuestions.length})</h3>
            </div>

            <div className="space-y-4">
                {filteredQuestions.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No questions found</p>
                ) : (
                    filteredQuestions.map((question) => {
                        const isDue = dueQuestions.some(q => q._id === question._id);
                        const isEditable = canEditQuestion(question);

                        return (
                            <div
                                key={question._id}
                                className={`card ${isDue ? 'border-l-4 border-l-warning' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex flex-wrap gap-2">
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                            Part {question.part}
                                        </span>

                                        {question.category && (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                                                {question.category}
                                            </span>
                                        )}

                                        {question.isPublic && (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning/10 text-warning">
                                                Public
                                            </span>
                                        )}

                                        {isDue && (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-danger/10 text-danger">
                                                Due
                                            </span>
                                        )}
                                    </div>

                                    {isEditable && (
                                        <button
                                            onClick={() => handleEditQuestion(question)}
                                            className="text-primary hover:text-primary-dark"
                                            title="Edit Question"
                                        >
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                <p className="mb-3">{question.text}</p>

                                <div className="space-y-1 mb-2">
                                    {Object.entries(question.options).map(([letter, text]) => (
                                        text && (
                                            <div
                                                key={letter}
                                                className={`text-sm py-1 ${letter === question.correctAnswer
                                                    ? 'text-success font-medium'
                                                    : 'text-gray-700'
                                                    }`}
                                            >
                                                <span className="font-bold">{letter}:</span> {text}
                                            </div>
                                        )
                                    ))}
                                </div>

                                {question.explanation && (
                                    <div className="mt-2 text-sm text-gray-600">
                                        <div className="font-medium">Explanation:</div>
                                        <p>{question.explanation}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Question Edit Modal */}
            {editQuestion && (
                <QuestionEditModal
                    question={editQuestion}
                    onClose={() => setEditQuestion(null)}
                    onUpdate={handleQuestionUpdate}
                />
            )}
        </div>
    );
};

export default BrowsePage;