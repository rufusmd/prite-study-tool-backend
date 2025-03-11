// routes/explanation.js
const express = require('express');
const axios = require('axios');
const router = express.Router();
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// @route   POST api/explanation/generate
// @desc    Generate explanation for a PRITE question using Claude
// @access  Private
router.post('/generate', async (req, res) => {
    try {
        const { question, options, correctAnswer } = req.body;

        if (!question || !options || !correctAnswer) {
            return res.status(400).json({
                success: false,
                error: 'Question, options, and correct answer are required'
            });
        }

        // Format the question and options for Claude
        let formattedQuestion = `Question: ${question}\n\nOptions:\n`;

        for (const [letter, text] of Object.entries(options)) {
            if (text) {
                formattedQuestion += `${letter}. ${text}\n`;
            }
        }

        formattedQuestion += `\nCorrect answer: ${correctAnswer}. ${options[correctAnswer]}`;

        // Create the prompt for Claude
        const prompt = `You are the world's foremost expert in psychiatry, neurology, and medical sciences, and you're explaining a PRITE (Psychiatry Resident In-Training Examination) question.

Provide a complete explanation for this PRITE question in the following format:
1. A thorough explanation of why the correct answer is right (2-3 paragraphs)
2. A concise summary of why the correct answer is right (2-3 sentences)
3. For each incorrect option, explain why it's incorrect (2-3 sentences per option)

Here is the question:
${formattedQuestion}`;

        // Call Claude API
        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: "claude-3-sonnet-20240229",
            max_tokens: 2000,
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
});

module.exports = router;