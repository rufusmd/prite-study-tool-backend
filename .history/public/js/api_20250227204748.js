// public/js/api.js
// API service for making requests to the backend

class ApiService {
    constructor() {
        // Base URL for API requests
        this.baseUrl = '/api';

        // Check for token in local storage
        this.token = localStorage.getItem('token');
    }

    // Set auth token
    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    // Clear auth token
    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
    }

    // Helper method for making authenticated requests
    async fetchWithAuth(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        // Set up headers with authorization
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['x-auth-token'] = this.token;
        }

        // Make the request
        const response = await fetch(url, {
            ...options,
            headers
        });

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');

        // Parse the response
        const data = isJson ? await response.json() : await response.text();

        // Handle error responses
        if (!response.ok) {
            throw new Error(
                isJson && data.message ? data.message : 'An error occurred'
            );
        }

        return data;
    }

    // Auth methods
    async register(username, email, password) {
        const data = await this.fetchWithAuth('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });

        if (data.token) {
            this.setToken(data.token);
        }

        return data;
    }

    async login(username, password) {
        const data = await this.fetchWithAuth('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });

        if (data.token) {
            this.setToken(data.token);
        }

        return data;
    }

    async getCurrentUser() {
        return this.fetchWithAuth('/auth/me');
    }

    // Question methods
    async createQuestion(questionData) {
        return this.fetchWithAuth('/questions', {
            method: 'POST',
            body: JSON.stringify(questionData)
        });
    }

    async getUserQuestions() {
        return this.fetchWithAuth('/questions');
    }

    async getDueQuestions() {
        return this.fetchWithAuth('/questions/due');
    }

    async updateQuestion(id, questionData) {
        return this.fetchWithAuth(`/questions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(questionData)
        });
    }

    async updateStudyData(id, difficulty) {
        return this.fetchWithAuth(`/questions/${id}/study`, {
            method: 'PATCH',
            body: JSON.stringify({ difficulty })
        });
    }

    async deleteQuestion(id) {
        return this.fetchWithAuth(`/questions/${id}`, {
            method: 'DELETE'
        });
    }
}

// Create a global instance of the API service
const api = new ApiService();