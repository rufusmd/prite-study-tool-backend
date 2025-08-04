// src/services/explanationService.js
import api from '../utils/api';

/**
 * Service for handling question explanation generation
 */
const explanationService = {
    /**
     * Generate an explanation for a question using Claude AI
     * @param {Object} question - The question object to explain
     * @returns {Promise<Object>} - Result with success status and data/error
     */
    generateExplanation: async (question) => {
        try {
            // Call the dedicated explanation endpoint
            const response = await api.post('/claude/explanation', {
                questionId: question._id,
                questionText: question.text,
                options: question.options,
                correctAnswer: question.correctAnswer
            });

            if (response.data && response.data.success) {
                return {
                    success: true,
                    data: response.data.explanation
                };
            } else {
                throw new Error(response.data?.error || 'Failed to generate explanation');
            }
        } catch (error) {
            console.error('Explanation generation error:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Failed to generate explanation'
            };
        }
    },

    /**
     * Save an explanation for a question
     * @param {string} questionId - The ID of the question
     * @param {string} explanation - The explanation text
     * @returns {Promise<Object>} - Result with success status and data/error
     */
    saveExplanation: async (questionId, explanation) => {
        try {
            const response = await api.patch(`/questions/${questionId}`, {
                explanation: explanation
            });

            if (response.data) {
                return {
                    success: true,
                    data: response.data
                };
            } else {
                throw new Error('Failed to save explanation');
            }
        } catch (error) {
            console.error('Error saving explanation:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Failed to save explanation'
            };
        }
    }
};

export default explanationService;