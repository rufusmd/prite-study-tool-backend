// src/api/priteScoreApi.js
import api from '../utils/api';

const priteScoreApi = {
    // Get all PRITE scores for the current user
    getScores: async () => {
        try {
            const response = await api.get('/users/prite-scores');
            return {
                success: true,
                scores: response.data.scores
            };
        } catch (error) {
            console.error('Error fetching PRITE scores:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch PRITE scores'
            };
        }
    },

    // Get a single PRITE score by ID
    getScoreById: async (scoreId) => {
        try {
            const response = await api.get(`/users/prite-scores/${scoreId}`);
            return {
                success: true,
                score: response.data.score
            };
        } catch (error) {
            console.error('Error fetching PRITE score:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch PRITE score'
            };
        }
    },

    // Create a new PRITE score
    createScore: async (scoreData) => {
        try {
            const response = await api.post('/users/prite-scores', scoreData);
            return {
                success: true,
                score: response.data.score
            };
        } catch (error) {
            console.error('Error creating PRITE score:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to create PRITE score'
            };
        }
    },

    // Update a PRITE score
    updateScore: async (scoreId, scoreData) => {
        try {
            const response = await api.put(`/users/prite-scores/${scoreId}`, scoreData);
            return {
                success: true,
                score: response.data.score
            };
        } catch (error) {
            console.error('Error updating PRITE score:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to update PRITE score'
            };
        }
    },

    // Delete a PRITE score
    deleteScore: async (scoreId) => {
        try {
            const response = await api.delete(`/users/prite-scores/${scoreId}`);
            return {
                success: true,
                message: response.data.message
            };
        } catch (error) {
            console.error('Error deleting PRITE score:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to delete PRITE score'
            };
        }
    }
};

export default priteScoreApi;