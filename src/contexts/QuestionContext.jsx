// src/contexts/QuestionContext.jsx
import { createContext, useState, useEffect, useContext } from 'react';
import { questionApi } from '../api';
import { AuthContext } from './AuthContext';
import { PRITE_CATEGORIES } from '../constants/categories';

export const QuestionContext = createContext();

export const QuestionProvider = ({ children }) => {
    const { isAuthenticated, user } = useContext(AuthContext);
    const [questions, setQuestions] = useState([]);
    const [dueQuestions, setDueQuestions] = useState([]);
    const [currentStudySession, setCurrentStudySession] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [categoryStats, setCategoryStats] = useState({});
    const [userStats, setUserStats] = useState({
        totalStudied: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        masteryLevel: 0,
        streakDays: 0,
        lastStudyDate: null,
        studyHistory: [],
        categoryPerformance: {},
        recentPerformance: [],
        weakestCategories: [],
        strongestCategories: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [sessionStats, setSessionStats] = useState({
        startTime: null,
        questionsAnswered: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        answerTimes: []
    });

    // Load questions when authenticated
    useEffect(() => {
        if (isAuthenticated) {
            loadQuestions();
            loadUserStats();
        }
    }, [isAuthenticated]);

    // Calculate category statistics whenever questions change
    useEffect(() => {
        if (questions.length > 0) {
            calculateCategoryStats();
        }
    }, [questions, dueQuestions]);

    // Calculate statistics by category
    const calculateCategoryStats = () => {
        const stats = {};

        // Initialize all predefined categories
        PRITE_CATEGORIES.forEach(cat => {
            stats[cat] = {
                total: 0,
                mastered: 0,
                due: 0,
                accuracy: 0
            };
        });

        // Count questions by category
        questions.forEach(q => {
            const category = q.category || "Uncategorized";

            // Initialize category if it doesn't exist
            if (!stats[category]) {
                stats[category] = {
                    total: 0,
                    mastered: 0,
                    due: 0,
                    accuracy: 0
                };
            }

            // Increment total count
            stats[category].total += 1;

            // Check if mastered
            const userData = q.studyData?.find(data => data.user === q.creator);
            if (userData?.easeFactor > 2.5) {
                stats[category].mastered += 1;
            }
        });

        // Count due questions by category
        dueQuestions.forEach(dueQ => {
            const question = questions.find(q => q._id === dueQ._id);
            if (question) {
                const category = question.category || "Uncategorized";
                if (stats[category]) {
                    stats[category].due += 1;
                }
            }
        });

        // Calculate accuracy percentages
        Object.keys(stats).forEach(cat => {
            const { total, mastered } = stats[cat];
            stats[cat].accuracy = total > 0 ? Math.round((mastered / total) * 100) : 0;
        });

        setCategoryStats(stats);
    };

    // Load user study statistics
    const loadUserStats = async () => {
        try {
            // For now, load from localStorage as a placeholder
            // In a real implementation, you'd fetch this from your API
            const savedStats = localStorage.getItem('userStudyStats');

            if (savedStats) {
                const parsedStats = JSON.parse(savedStats);
                setUserStats(parsedStats);
            } else {
                // Initialize with default values
                setUserStats({
                    totalStudied: 0,
                    correctAnswers: 0,
                    incorrectAnswers: 0,
                    masteryLevel: 0,
                    streakDays: 0,
                    lastStudyDate: null,
                    studyHistory: [],
                    categoryPerformance: {},
                    recentPerformance: [],
                    weakestCategories: [],
                    strongestCategories: []
                });
            }

            // In the future, implement an API call:
            // const response = await questionApi.getUserStats();
            // if (response.success) {
            //     setUserStats(response.data);
            // }
        } catch (err) {
            console.error('Failed to load user stats:', err);
        }
    };

    // Start a study session with improved tracking
    const startStudySession = (categoryFilter = null) => {
        // Get due questions, optionally filtered by category
        let filteredQuestions = [...dueQuestions];

        if (categoryFilter) {
            filteredQuestions = dueQuestions.filter(dueQ => {
                const question = questions.find(q => q._id === dueQ._id);
                return question && question.category === categoryFilter;
            });
        }

        if (filteredQuestions.length === 0) {
            setError(categoryFilter
                ? `No questions due for review in the ${categoryFilter} category`
                : 'No questions due for review');
            return false;
        }

        // Create a copy and shuffle the array
        const shuffled = [...filteredQuestions].sort(() => Math.random() - 0.5);
        setCurrentStudySession(shuffled);
        setCurrentQuestionIndex(0);

        // Reset session stats
        setSessionStats({
            startTime: new Date(),
            questionsAnswered: 0,
            correctAnswers: 0,
            incorrectAnswers: 0,
            answerTimes: []
        });

        // Update user stats to account for the new study session
        updateStudyStreak();

        return true;
    };

    // Update study streak
    const updateStudyStreak = () => {
        const today = new Date().toDateString();

        setUserStats(prev => {
            // If already studied today, maintain streak
            if (prev.lastStudyDate === today) {
                return prev;
            }

            // If studied yesterday, increment streak
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayString = yesterday.toDateString();

            const newStreakDays = prev.lastStudyDate === yesterdayString
                ? prev.streakDays + 1
                : 1; // Reset streak if there was a gap

            // Update history
            const updatedHistory = [...prev.studyHistory];
            const todayEntry = updatedHistory.find(entry => entry.date === today);

            if (todayEntry) {
                todayEntry.sessionsCount += 1;
            } else {
                updatedHistory.push({
                    date: today,
                    sessionsCount: 1,
                    questionsStudied: 0
                });
            }

            return {
                ...prev,
                lastStudyDate: today,
                streakDays: newStreakDays,
                studyHistory: updatedHistory
            };
        });

        // Save to localStorage
        saveUserStats();
    };

    // Track answer attempt during study session
    const trackAnswerAttempt = (questionId, selectedAnswer, isCorrect, timeSpent) => {
        const question = questions.find(q => q._id === questionId);
        if (!question) return;

        const category = question.category || "Uncategorized";

        // Update session stats
        setSessionStats(prev => ({
            ...prev,
            questionsAnswered: prev.questionsAnswered + 1,
            correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
            incorrectAnswers: prev.incorrectAnswers + (isCorrect ? 0 : 1),
            answerTimes: [...prev.answerTimes, timeSpent]
        }));

        // Update user stats
        setUserStats(prev => {
            // Update total counts
            const totalStudied = prev.totalStudied + 1;
            const correctAnswers = prev.correctAnswers + (isCorrect ? 1 : 0);
            const incorrectAnswers = prev.incorrectAnswers + (isCorrect ? 0 : 1);

            // Calculate mastery level (percentage of correct answers)
            const masteryLevel = totalStudied > 0
                ? Math.round((correctAnswers / totalStudied) * 100)
                : 0;

            // Update category performance
            const categoryPerformance = { ...prev.categoryPerformance };

            if (!categoryPerformance[category]) {
                categoryPerformance[category] = {
                    total: 0,
                    correct: 0,
                    accuracy: 0
                };
            }

            categoryPerformance[category].total += 1;
            if (isCorrect) {
                categoryPerformance[category].correct += 1;
            }
            categoryPerformance[category].accuracy = Math.round(
                (categoryPerformance[category].correct / categoryPerformance[category].total) * 100
            );

            // Update recent performance (last 10 questions)
            const recentPerformance = [
                {
                    questionId,
                    category,
                    isCorrect,
                    date: new Date().toISOString(),
                    timeSpent
                },
                ...prev.recentPerformance
            ].slice(0, 10);

            // Update study history for today
            const today = new Date().toDateString();
            const updatedHistory = [...prev.studyHistory];
            const todayEntry = updatedHistory.find(entry => entry.date === today);

            if (todayEntry) {
                todayEntry.questionsStudied += 1;
            }

            // Calculate strongest and weakest categories
            const categoriesArray = Object.entries(categoryPerformance)
                .filter(([_, data]) => data.total >= 5) // Only consider categories with at least 5 questions
                .map(([cat, data]) => ({
                    name: cat,
                    accuracy: data.accuracy
                }));

            const sortedCategories = [...categoriesArray].sort((a, b) => a.accuracy - b.accuracy);

            const weakestCategories = sortedCategories.slice(0, 3);
            const strongestCategories = [...sortedCategories].reverse().slice(0, 3);

            return {
                totalStudied,
                correctAnswers,
                incorrectAnswers,
                masteryLevel,
                streakDays: prev.streakDays,
                lastStudyDate: today,
                studyHistory: updatedHistory,
                categoryPerformance,
                recentPerformance,
                weakestCategories,
                strongestCategories
            };
        });

        // Save to localStorage
        saveUserStats();
    };

    // Save user stats to localStorage (in production, would save to server instead)
    const saveUserStats = () => {
        localStorage.setItem('userStudyStats', JSON.stringify(userStats));
    };

    // Move to next question
    const nextQuestion = () => {
        if (currentQuestionIndex < currentStudySession.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            return true;
        }
        return false;
    };

    // Get questions by category
    const getQuestionsByCategory = (category) => {
        if (!category) return questions;
        return questions.filter(q => q.category === category);
    };

    // Get due questions by category
    const getDueQuestionsByCategory = (category) => {
        if (!category) return dueQuestions;

        return dueQuestions.filter(dueQ => {
            const question = questions.find(q => q._id === dueQ._id);
            return question && question.category === category;
        });
    };

    // Update study data for a question
    const updateStudyData = async (questionId, difficulty, selectedAnswer) => {
        setLoading(true);
        try {
            // Calculate if answer was correct
            const question = questions.find(q => q._id === questionId);
            if (!question) throw new Error('Question not found');

            const isCorrect = selectedAnswer === question.correctAnswer;

            // Calculate time spent on question
            const now = new Date();
            const questionStartTime = sessionStats.answerTimes.length > 0
                ? now - sessionStats.startTime - sessionStats.answerTimes.reduce((a, b) => a + b, 0)
                : now - sessionStats.startTime;

            // Track this answer attempt
            trackAnswerAttempt(questionId, selectedAnswer, isCorrect, questionStartTime);

            const response = await questionApi.updateStudyData(questionId, difficulty);
            if (response.success) {
                // Update the question in our state
                const updatedQuestions = questions.map(q =>
                    q._id === questionId ? response.data : q
                );
                setQuestions(updatedQuestions);
            } else {
                setError(response.error);
            }
        } catch (err) {
            setError('Failed to update study data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Load all questions
    const loadQuestions = async () => {
        setLoading(true);
        try {
            // Fetch all questions
            const questionsResponse = await questionApi.getQuestions();
            if (questionsResponse.success) {
                setQuestions(questionsResponse.data);
            }

            // Fetch due questions
            const dueResponse = await questionApi.getDueQuestions();
            if (dueResponse.success) {
                setDueQuestions(dueResponse.data);
            }
        } catch (err) {
            setError('Failed to load questions');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Parse questions from OCR text
    const parseQuestions = async (ocrText, part) => {
        setLoading(true);
        const response = await questionApi.parseQuestions(ocrText, part);
        setLoading(false);
        return response;
    };

    // Add bulk questions
    const addBulkQuestions = async (questionsToAdd) => {
        setLoading(true);
        const response = await questionApi.createBulkQuestions(questionsToAdd);

        if (response.success) {
            // Reload questions to get the updated list
            await loadQuestions();
        }

        setLoading(false);
        return response;
    };

    // Get all category names
    const getAllCategories = () => {
        // Combine predefined categories with any custom ones from the data
        const usedCategories = [...new Set(questions
            .filter(q => q.category)
            .map(q => q.category))];

        return [...new Set([...PRITE_CATEGORIES, ...usedCategories])];
    };

    // Get study streak data
    const getStudyStreak = () => {
        return {
            current: userStats.streakDays,
            lastStudyDate: userStats.lastStudyDate
        };
    };

    // Get current session statistics
    const getSessionStats = () => {
        return {
            ...sessionStats,
            accuracy: sessionStats.questionsAnswered > 0
                ? Math.round((sessionStats.correctAnswers / sessionStats.questionsAnswered) * 100)
                : 0,
            averageTime: sessionStats.answerTimes.length > 0
                ? Math.round(sessionStats.answerTimes.reduce((a, b) => a + b, 0) / sessionStats.answerTimes.length / 1000)
                : 0
        };
    };

    // Get user performance statistics
    const getUserPerformanceStats = () => {
        return {
            totalStudied: userStats.totalStudied,
            masteryLevel: userStats.masteryLevel,
            streakDays: userStats.streakDays,
            categoryPerformance: userStats.categoryPerformance,
            weakestCategories: userStats.weakestCategories,
            strongestCategories: userStats.strongestCategories,
            recentPerformance: userStats.recentPerformance
        };
    };

    // Clear error state
    const clearError = () => setError(null);

    return (
        <QuestionContext.Provider
            value={{
                questions,
                dueQuestions,
                currentStudySession,
                currentQuestionIndex,
                categoryStats,
                sessionStats: getSessionStats(),
                userStats: getUserPerformanceStats(),
                loading,
                error,
                loadQuestions,
                startStudySession,
                nextQuestion,
                updateStudyData,
                parseQuestions,
                addBulkQuestions,
                getQuestionsByCategory,
                getDueQuestionsByCategory,
                getAllCategories,
                getStudyStreak,
                clearError
            }}
        >
            {children}
        </QuestionContext.Provider>
    );
};

export default QuestionContext;