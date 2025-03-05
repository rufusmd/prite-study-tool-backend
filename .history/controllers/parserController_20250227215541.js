const Question = require('../models/Question');

// Parse OCR text into question objects
exports.parseQuestions = async (req, res) => {
    try {
        const { ocrText, part } = req.body;

        if (!ocrText) {
            return res.status(400).json({ message: 'OCR text is required' });
        }

        // Regular expression to find question blocks with numbers
        const questionRegex = /(\d+)[\.\)]\s+([\s\S]*?)(?=\n\s*\d+[\.\)]|$)/g;
        let match;
        const parsedQuestions = [];

        // Process each question found
        while ((match = questionRegex.exec(ocrText)) !== null) {
            const questionNumber = match[1].trim();
            let questionContent = match[2].trim();

            // Find where options start
            const optionStart = questionContent.search(/\n\s*[A-E][\.\)]/);
            if (optionStart === -1) continue; // Skip if no options found

            const questionText = questionContent.substring(0, optionStart).trim();
            const optionsText = questionContent.substring(optionStart);

            // Parse options
            const options = {};
            const optionRegex = /\n\s*([A-E])[\.\)]\s+([\s\S]*?)(?=\n\s*[A-E][\.\)]|$)/g;
            let optionMatch;

            while ((optionMatch = optionRegex.exec(optionsText)) !== null) {
                const letter = optionMatch[1];
                const text = optionMatch[2].trim();
                options[letter] = text;
            }

            // Create question object
            const question = {
                number: questionNumber,
                part: part || "1",
                text: questionText,
                options: options,
                correctAnswer: "",
                creator: req.user.id
            };

            parsedQuestions.push(question);
        }

        res.json(parsedQuestions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Parse answer key and update questions
exports.parseAnswers = async (req, res) => {
    try {
        const { answerKeyText, part, questionIds } = req.body;

        if (!answerKeyText || !questionIds || !Array.isArray(questionIds)) {
            return res.status(400).json({
                message: 'Answer key text and question IDs array are required'
            });
        }

        // Parse answer key
        const answers = {};

        // Try to detect the format and parse accordingly
        if (answerKeyText.includes('(') && answerKeyText.includes(')')) {
            // Complex PRITE format with parentheses
            const answerPattern = /(\d+)\s+[A-E]?\(?([A-E])\)?/g;
            let match;

            while ((match = answerPattern.exec(answerKeyText)) !== null) {
                const questionNumber = match[1].trim();
                const correctAnswer = match[2].trim(); // Get the letter inside parentheses

                // Add base number based on part (1-150 or 151-300)
                const adjustedNumber = part === '1' ? questionNumber : (parseInt(questionNumber) + 150).toString();
                answers[adjustedNumber] = correctAnswer;
            }
        } else {
            // Simple format
            const answerPattern = /(\d+)\s+([A-E])/g;
            let match;

            while ((match = answerPattern.exec(answerKeyText)) !== null) {
                const questionNumber = match[1].trim();
                const correctAnswer = match[2].trim();

                // Add base number based on part (1-150 or 151-300)
                const adjustedNumber = part === '1' ? questionNumber : (parseInt(questionNumber) + 150).toString();
                answers[adjustedNumber] = correctAnswer;
            }
        }

        // Get all questions to update
        const questions = await Question.find({
            _id: { $in: questionIds },
            creator: req.user.id
        });

        // Update questions with answers
        const updatedQuestions = [];
        for (const question of questions) {
            if (answers[question.number]) {
                question.correctAnswer = answers[question.number];
                await question.save();
                updatedQuestions.push(question);
            }
        }

        res.json({
            updated: updatedQuestions.length,
            questions: updatedQuestions
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};