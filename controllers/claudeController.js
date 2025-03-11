// controllers/claudeController.js
const axios = require('axios');
const rateLimit = require('express-rate-limit');

// Create a rate limiter for general Claude API requests
exports.claudeApiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 requests per 15 minutes
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Create a more restrictive rate limiter for explanation generation
// as it's more resource-intensive
exports.explanationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 explanation requests per 15 minutes
    message: 'Too many explanation requests, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});

// Process text with Claude
exports.processText = async (req, res) => {
    try {
        const { text, format, prompt } = req.body;

        if (!text) {
            return res.status(400).json({
                success: false,
                error: 'Text is required for processing'
            });
        }

        // Use custom prompt if provided, otherwise use default prompts based on format
        let finalPrompt = prompt;

        if (!finalPrompt) {
            if (format === 'json') {
                finalPrompt = `Extract PRITE exam questions from the following text and format as a JSON array where each question has this structure:
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
                finalPrompt = `Extract all PRITE exam questions from the following text. Format each question with its number, text, and options A-E. Preserve the exact wording and separate each question clearly. Here is the content:

${text}`;
            }
        }

        // Call Claude API
        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: "claude-3-sonnet-20240229",
            max_tokens: 4000,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: finalPrompt
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

        // Extract the response text
        const assistantMessage = response.data.content[0].text;

        res.json({
            success: true,
            data: assistantMessage
        });
    } catch (error) {
        console.error('Claude API error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to process with Claude',
            details: error.response?.data?.error?.message || error.message
        });
    }
};

// Generate explanation for a question
exports.generateExplanation = async (req, res) => {
    try {
        const { questionText, options, correctAnswer, correctAnswerText } = req.body;

        // Validate required inputs
        if (!questionText || !options || !correctAnswer) {
            return res.status(400).json({
                success: false,
                error: 'Question text, options, and correct answer are required'
            });
        }

        // Prepare incorrect options text
        const incorrectOptions = Object.entries(options)
            .filter(([letter]) => letter !== correctAnswer)
            .map(([letter, text]) => `${letter}. ${text}`)
            .join('\n');

        // Create the prompt for Claude
        const prompt = `You are a world-class expert in psychiatry, neurology, and all medical topics covered in the PRITE (Psychiatry Resident In-Training Examination). 

Please provide a comprehensive explanation for the following PRITE question:

Question: ${questionText}

Options:
${Object.entries(options).map(([letter, text]) => `${letter}. ${text}`).join('\n')}

Correct answer: ${correctAnswer}. ${correctAnswerText || options[correctAnswer]}

Please structure your explanation as follows:
1. A thorough explanation (3-4 paragraphs) of why answer ${correctAnswer} is correct, covering relevant pathophysiology, diagnostic criteria, and clinical implications.
2. A concise 2-3 sentence summary of why answer ${correctAnswer} is correct.
3. For each incorrect option, provide 2-3 sentences explaining why it is incorrect:
   - Why option ${incorrectOptions.split('\n').map(line => line.charAt(0)).join(', ')} are incorrect.

Be authoritative, accurate, and educational in your explanation, similar to UWorld explanations. Include relevant DSM-5 criteria, clinical pearls, and high-yield information for board exams.`;

        // Call Claude API with higher token limit for explanations
        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: "claude-3-sonnet-20240229",
            max_tokens: 6000, // Higher token limit for detailed explanations
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

        // Extract the response text
        const explanation = response.data.content[0].text;

        res.json({
            success: true,
            explanation
        });
    } catch (error) {
        console.error('Explanation generation error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to generate explanation',
            details: error.response?.data?.error?.message || error.message
        });
    }
};