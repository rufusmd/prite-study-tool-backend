const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Log all requests
app.use((req, res, next) => {
    console.log(`Request received: ${req.method} ${req.path}`);
    next();
});

// Initialize the Anthropic client
console.log('Initializing Anthropic client...');
const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY,
});
console.log('Anthropic client initialized');

// Basic test endpoint
app.get('/api/test', (req, res) => {
    console.log('Test endpoint hit');
    res.json({ message: 'Simple test server is working!' });
});

// Claude API endpoint
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

// Root endpoint
app.get('/', (req, res) => {
    console.log('Root endpoint hit');
    res.send('Simple test server root endpoint');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Simple test server running on port ${PORT}`);
});