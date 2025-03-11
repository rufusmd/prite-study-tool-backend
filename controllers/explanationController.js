// controllers/explanationController.js
const axios = require('axios');
const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for explanation generation
 * More restrictive than general Claude API since explanations are more resource-intensive
 */
exports.explanationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 explanation requests per 15 minutes
    message: 'Too many explanation requests, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Generate explanation for a question
 */
exports.generateExplanation = async (req, res) => {
    try {
        const { questionText, options, correctAnswer } = req.body;

        // Validate required inputs
        if (!questionText || !options || !correctAnswer) {
            return res.status(400).json({
                success: false,
                error: 'Question text, options, and correct answer are required'
            });
        }

        // Get the correct answer text
        const correctAnswerText = options[correctAnswer];

        // Prepare incorrect options text
        const incorrectOptions = Object.entries(options)
            .filter(([letter]) => letter !== correctAnswer)
            .map(([letter, text]) => `${letter}. ${text}`)
            .join('\n');

        // Create the explanation prompt for Claude
        const prompt = `TASK: Create an educational explanation for a PRITE (Psychiatry Resident In-Training Examination) question.

QUESTION: "${questionText}"

ANSWER OPTIONS:
${Object.entries(options).map(([letter, text]) => `${letter}. ${text}`).join('\n')}

CORRECT ANSWER: ${correctAnswer}. ${correctAnswerText}

INSTRUCTIONS:
1. Provide a comprehensive, educational explanation of why answer ${correctAnswer} is correct
2. Explain why each of the other options is incorrect
3. Include relevant medical knowledge, DSM criteria, and clinical implications
4. Format your explanation as a teaching tool for psychiatry residents

Remember, I already know the question and correct answer. Your task is ONLY to provide the explanation.`;

        // Call Claude API with a higher token limit for detailed explanations
        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: "claude-3-7-sonnet-20250219", // Updated model
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