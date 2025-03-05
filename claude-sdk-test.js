require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

async function testClaudeWithSDK() {
    try {
        console.log('Testing Claude API connection using the SDK...');

        // Create the Anthropic client
        const anthropic = new Anthropic({
            apiKey: process.env.CLAUDE_API_KEY,
        });

        console.log('API Key exists:', !!process.env.CLAUDE_API_KEY);

        // Simple test prompt
        const testPrompt = "Test question: What is psychiatry? A) Science of the mind B) Medical specialty";

        console.log('Sending request to Claude API...');
        const response = await anthropic.messages.create({
            model: "claude-3-7-sonnet-20250219", // Updated to the model from your example
            max_tokens: 1024,
            messages: [{ role: "user", content: testPrompt }],
        });

        console.log('Response received from Claude!');
        console.log('Response content:');
        console.log(response.content[0].text);
        console.log('\nFull response:');
        console.log(JSON.stringify(response, null, 2));
    } catch (error) {
        console.error('Error occurred:');
        console.error('Message:', error.message);
        console.error('Full error:', error);
    }
}

testClaudeWithSDK();