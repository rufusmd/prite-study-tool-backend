// new-server.js (updated)
const express = require('express');
const path = require('path');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Basic middleware
app.use(cors({
    origin: ['https://studyprite.com.vercel.app', 'http://localhost:5173'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// Log all requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Initialize the Anthropic client
console.log('Initializing Anthropic client...');
const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY,
});
console.log('Anthropic client initialized');

// Test endpoints
app.get('/api/test', (req, res) => {
    console.log('Test endpoint hit');
    res.json({ message: 'Test endpoint is working!' });
});

// Claude API endpoint - keep this unprotected
app.post('/api/claude', async (req, res) => {
    console.log('Claude endpoint hit');
    try {
        const { text, format } = req.body;

        // Determine prompt based on format
        let prompt;
        if (format === 'json') {
            prompt = `Extract PRITE exam questions from the following text and format as a JSON array where each question has this structure:
{
  "number": "1",
  "text": "Question text here",
  "options": {
    "A": "Option A text",
    "B": "Option B text",
    "C": "Option C text",
    "D": "Option D text",
    "E": "Option E text"
  }
}
Return only valid JSON with no other text. Here is the content:

${text}`;
        } else {
            prompt = `Extract all PRITE exam questions from the following text. Format each question with its number, text, and options A-E. Preserve the exact wording and separate each question clearly. Here is the content:

${text}`;
        }

        console.log('Sending request to Claude API');

        const response = await anthropic.messages.create({
            model: "claude-3-7-sonnet-20250219",
            max_tokens: 4000,
            messages: [{ role: "user", content: prompt }],
        });

        console.log('Response received from Claude');

        res.json({
            success: true,
            data: response.content[0].text
        });
    } catch (error) {
        console.error('Claude API error:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to process with Claude',
            details: error.message
        });
    }
});

// Load auth middleware
const auth = require('./middleware/auth');

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/questions', auth, require('./routes/questions'));
app.use('/api/parser', auth, require('./routes/parser'));
app.use('/api/users/prite-scores', require('./routes/priteScores'));

// Static files - must come BEFORE the catch-all route
app.use(express.static('public'));

// Catch-all route - must be LAST
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// MongoDB connection
console.log('Attempting to connect to MongoDB...');
const mongoose = require('mongoose');

if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not defined in environment variables!');
    process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB successfully!');

        // Start the server AFTER MongoDB connects
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('MongoDB connection error:');
        console.error(err);
    });