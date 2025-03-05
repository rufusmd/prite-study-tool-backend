// public/js/api.js
class ApiService {
    constructor() {
        this.baseUrl = '/api';
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

    // Helper for making authenticated requests
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

        try {
            // Make the request
            const response = await fetch(url, {
                ...options,
                headers
            });

            // Parse the response based on content type
            const contentType = response.headers.get('content-type');
            const data = contentType && contentType.includes('application/json')
                ? await response.json()
                : await response.text();

            // Handle error responses
            if (!response.ok) {
                throw new Error(data.message || 'An error occurred');
            }

            return data;
        } catch (error) {
            console.error(`API Error (${endpoint}):`, error);
            throw error;
        }
    }

    // Auth methods
    async register(username, email, password) {
        return this.fetchWithAuth('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, email, password })
        });
    }

    async login(username, password) {
        return this.fetchWithAuth('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    async getCurrentUser() {
        return this.fetchWithAuth('/auth/me');
    }

    // Question methods
    async getQuestions() {
        return this.fetchWithAuth('/questions');
    }

    async getDueQuestions() {
        return this.fetchWithAuth('/questions/due');
    }

    async getQuestionById(id) {
        return this.fetchWithAuth(`/questions/${id}`);
    }

    async createQuestion(questionData) {
        return this.fetchWithAuth('/questions', {
            method: 'POST',
            body: JSON.stringify(questionData)
        });
    }

    async updateQuestion(id, questionData) {
        return this.fetchWithAuth(`/questions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(questionData)
        });
    }

    async deleteQuestion(id) {
        return this.fetchWithAuth(`/questions/${id}`, {
            method: 'DELETE'
        });
    }

    async updateStudyData(id, difficulty) {
        return this.fetchWithAuth(`/questions/${id}/study`, {
            method: 'PATCH',
            body: JSON.stringify({ difficulty })
        });
    }

    async searchQuestions(query = {}) {
        const params = new URLSearchParams();

        // Add search parameters
        if (query.text) params.append('text', query.text);
        if (query.part) params.append('part', query.part);
        if (query.category) params.append('category', query.category);
        if (query.visibility) params.append('visibility', query.visibility);

        return this.fetchWithAuth(`/questions/search?${params.toString()}`);
    }
    // Parse OCR text into question objects
    async parseQuestions(ocrText, part) {
        return this.fetchWithAuth('/parser/questions', {
            method: 'POST',
            body: JSON.stringify({ ocrText, part })
        });
    }

    // Parse answer key and update questions
    async parseAnswers(answerKeyText, part, questionIds) {
        return this.fetchWithAuth('/parser/answers', {
            method: 'POST',
            body: JSON.stringify({ answerKeyText, part, questionIds })
        });
    }

    // Bulk create questions
    async createBulkQuestions(questions) {
        return this.fetchWithAuth('/questions/bulk', {
            method: 'POST',
            body: JSON.stringify({ questions })
        });
    }
}

// Create and export a global instance
const api = new ApiService();