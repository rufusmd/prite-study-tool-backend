const axios = require('axios');

exports.processText = async (req, res) => {
    try {
        const { text, format, prompt } = req.body;

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

        console.log('Sending request to Claude API');

        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: "claude-3-7-sonnet-20250219", // Updated model name
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

        console.log('Received response from Claude API');

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