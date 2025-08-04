// src/services/claudeService.js
import claudeApi from '../api/claudeApi';

const claudeService = {
    // Process text with Claude (existing functionality from claudeApi)
    processText: async (text, format = 'json', customPrompt = null) => {
        return claudeApi.processText(text, format, customPrompt);
    },

    // Generate explanation for a question (new functionality)
    generateExplanation: async (question) => {
        try {
            // Prepare the data for an explanation
            const correctAnswerText = question.options[question.correctAnswer];
            const incorrectOptions = Object.entries(question.options)
                .filter(([letter]) => letter !== question.correctAnswer)
                .map(([letter, text]) => `${letter}. ${text}`)
                .join('\n');

            const prompt = `You are a world-class expert in psychiatry, neurology, and all medical topics covered in the PRITE (Psychiatry Resident In-Training Examination). 

Please provide a comprehensive explanation for the following PRITE question:

Question: ${question.text}

Options:
${Object.entries(question.options).map(([letter, text]) => `${letter}. ${text}`).join('\n')}

Correct answer: ${question.correctAnswer}. ${correctAnswerText}

Please structure your explanation as follows:
1. A thorough explanation (3-4 paragraphs) of why answer ${question.correctAnswer} is correct, covering relevant pathophysiology, diagnostic criteria, and clinical implications.
2. A concise 2-3 sentence summary of why answer ${question.correctAnswer} is correct.
3. For each incorrect option, provide 2-3 sentences explaining why it is incorrect:
   - Why option ${incorrectOptions.split('\n').map(line => line.charAt(0)).join(', ')} are incorrect.

Be authoritative, accurate, and educational in your explanation, similar to UWorld explanations. Include relevant DSM-5 criteria, clinical pearls, and high-yield information for board exams.`;

            // Use the existing claudeApi to process the text
            return claudeApi.processText(prompt, 'text');
        } catch (error) {
            console.error('Explanation generation error:', error);
            return {
                success: false,
                error: error.message || 'Failed to generate explanation'
            };
        }
    }
};

export default claudeService;