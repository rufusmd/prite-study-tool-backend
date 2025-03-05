require('dotenv').config();
const axios = require('axios');

async function testClaude() {
    try {
        console.log('Testing Claude API connection...');
        console.log('API Key exists:', !!process.env.CLAUDE_API_KEY);

        // Simple test prompt
        const testPrompt = "Test question: What is psychiatry? A) Science of the mind B) Medical specialty";

        console.log('Sending request to Claude API...');
        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: "claude-3-sonnet",          // Try this one first
            max_tokens: 4000,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: testPrompt
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

        console.log('Response received from Claude!');
        console.log('Response content:', response.data.content[0].text);
        console.log('Full response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error occurred:');
        console.error('Message:', error.message);

        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testClaude();