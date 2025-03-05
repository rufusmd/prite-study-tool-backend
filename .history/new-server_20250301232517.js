const express = require('express');
const path = require('path');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = 3000;

// In new-server.js, ADD THIS FIRST, before any middleware
app.get('/claude-test-public', (req, res) => {
    res.json({ message: 'Claude test route is accessible', timestamp: new Date().toISOString() });
});

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Log middleware - add this to see all requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

app.use((req, res, next) => {
    console.log(`Request received: ${req.method} ${req.url}`);
    next();
});

// Add this test endpoint to your server
app.get('/api/claude-test', async (req, res) => {
    console.log('Claude test endpoint hit');
    try {
        if (!process.env.CLAUDE_API_KEY) {
            return res.status(500).json({
                success: false,
                error: 'Claude API key is not configured'
            });
        }

        console.log('API Key exists:', !!process.env.CLAUDE_API_KEY);
        console.log('API Key first 4 chars:', process.env.CLAUDE_API_KEY.substring(0, 4));

        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: "claude-3-sonnet-20240229",
            max_tokens: 100,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Hello, please respond with just one word: Working"
                        }
                    ]
                }
            ]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01'
            }
        });

        res.json({
            success: true,
            message: 'Claude API test successful',
            response: response.data
        });
    } catch (error) {
        console.error('Claude API test error:');
        console.error('Error message:', error.message);

        // Check if it's a response error and log more details
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
            console.error('Headers:', error.response.headers);
        }

        res.status(500).json({
            success: false,
            error: 'Claude API test failed',
            details: error.message
        });
    }
});

// Direct Claude endpoint
app.post('/api/claude', async (req, res) => {
    console.log('Claude endpoint hit');
    try {
        const { text, format } = req.body;

        // Log request details (be careful not to log sensitive data)
        console.log('Request body:', {
            textLength: text?.length || 0,
            format: format || 'default'
        });

        if (!process.env.CLAUDE_API_KEY) {
            console.error('Missing Claude API key in environment variables');
            return res.status(500).json({
                success: false,
                error: 'Claude API key is not configured'
            });
        }

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
        console.log('Using API key:', process.env.CLAUDE_API_KEY ? 'Key is present (not showing for security)' : 'Missing key');

        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: "claude-3-sonnet-20240229",
            max_tokens: 4000,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: prompt
                        }
                    ]
                }
            ]
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.CLAUDE_API_KEY,
                'anthropic-version': '2023-06-01'
            }
        });

        console.log('Response received from Claude:', {
            status: response.status,
            hasContent: !!response.data.content
        });

        res.json({
            success: true,
            data: response.data.content[0].text
        });
    } catch (error) {
        console.error('Claude API error details:');

        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Response status:', error.response.status);
            console.error('Response headers:', error.response.headers);
            console.error('Response data:', error.response.data);
        } else if (error.request) {
            // The request was made but no response was received
            console.error('No response received:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error message:', error.message);
        }

        console.error('Error stack:', error.stack);

        res.status(500).json({
            success: false,
            error: 'Failed to process with Claude',
            details: error.message
        });
    }
});

// Existing API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/parser', require('./routes/parser'));

// Static files - must come BEFORE the catch-all route
app.use(express.static('public'));

// Catch-all route - must be LAST
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// MongoDB connection
if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not defined!');
    process.exit(1);
}

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('MongoDB connected');
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});