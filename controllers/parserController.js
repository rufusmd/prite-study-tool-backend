// controllers/parserController.js
const Question = require('../models/Question');

// Parse OCR text into question objects
exports.parseQuestions = async (req, res) => {
    try {
        const { ocrText, part } = req.body;

        if (!ocrText || !part) {
            return res.status(400).json({ message: 'OCR text and part are required' });
        }

        // Split the OCR text into lines
        const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

        // Regular expressions for parsing questions
        const questionRegex = /^(\d+)[.\s)]+(.+)/;
        const optionRegex = /^([A-Z])[.\s)]+(.+)/;

        // Process the lines to extract questions and options
        const questions = [];
        let currentQuestion = null;
        let currentOptions = {};
        let currentQuestionNumber = null;

        // Variables to detect special question types
        let specialSectionMarker = false;
        let fourOptionsSection = false;
        let multipleCorrectSection = false;
        let currentInstructions = '';

        // Process each line
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Check for special section markers
            if (line.toLowerCase().includes('questions with only four options')) {
                fourOptionsSection = true;
                specialSectionMarker = true;
                continue;
            }

            if (line.toLowerCase().includes('select three answers')) {
                multipleCorrectSection = true;
                specialSectionMarker = true;
                currentInstructions = 'Select the THREE correct answers.';
                continue;
            }

            // Check for question number at the beginning
            const questionMatch = line.match(questionRegex);

            if (questionMatch) {
                // Save the previous question if any
                if (currentQuestion) {
                    // Assign question type based on section
                    let questionType = 'standard';
                    let numCorrectAnswers = 1;
                    let instructions = '';

                    if (fourOptionsSection) {
                        questionType = 'fourOptions';
                    } else if (multipleCorrectSection) {
                        questionType = 'multipleCorrect';
                        numCorrectAnswers = 3;
                        instructions = currentInstructions;
                    }

                    // Check for special type based on the question text
                    const questionTextLower = currentQuestion.toLowerCase();
                    if (questionTextLower.includes('choose three') ||
                        questionTextLower.includes('select three') ||
                        questionTextLower.includes('choose 3') ||
                        questionTextLower.includes('select 3')) {
                        questionType = 'multipleCorrect';
                        numCorrectAnswers = 3;
                        instructions = 'Select the THREE correct answers.';
                    }

                    questions.push({
                        number: currentQuestionNumber,
                        text: currentQuestion,
                        options: { ...currentOptions },
                        part,
                        questionType,
                        numCorrectAnswers,
                        instructions,
                        ...(questionType === 'multipleCorrect' ? { correctAnswers: [] } : { correctAnswer: '' })
                    });
                }

                // Start a new question
                currentQuestionNumber = questionMatch[1];
                currentQuestion = questionMatch[2];
                currentOptions = {};
            } else {
                // Check if it's an option (A, B, C, D, E, etc.)
                const optionMatch = line.match(optionRegex);

                if (optionMatch && currentQuestion) {
                    // It's an answer option
                    const optionLetter = optionMatch[1];
                    const optionText = optionMatch[2];
                    currentOptions[optionLetter] = optionText;
                } else if (currentQuestion) {
                    // It's a continuation of the current question text
                    currentQuestion += ' ' + line;
                }
            }
        }

        // Add the last question
        if (currentQuestion) {
            // Assign question type based on section
            let questionType = 'standard';
            let numCorrectAnswers = 1;
            let instructions = '';

            if (fourOptionsSection) {
                questionType = 'fourOptions';
            } else if (multipleCorrectSection) {
                questionType = 'multipleCorrect';
                numCorrectAnswers = 3;
                instructions = currentInstructions;
            }

            // Check for special type based on the question text
            const questionTextLower = currentQuestion.toLowerCase();
            if (questionTextLower.includes('choose three') ||
                questionTextLower.includes('select three') ||
                questionTextLower.includes('choose 3') ||
                questionTextLower.includes('select 3')) {
                questionType = 'multipleCorrect';
                numCorrectAnswers = 3;
                instructions = 'Select the THREE correct answers.';
            }

            questions.push({
                number: currentQuestionNumber,
                text: currentQuestion,
                options: { ...currentOptions },
                part,
                questionType,
                numCorrectAnswers,
                instructions,
                ...(questionType === 'multipleCorrect' ? { correctAnswers: [] } : { correctAnswer: '' })
            });
        }

        // Post-process questions to ensure they have all the necessary fields
        const processedQuestions = questions.map(question => {
            // Ensure options has all the fields needed
            const options = {
                A: question.options.A || '',
                B: question.options.B || '',
                C: question.options.C || '',
                D: question.options.D || '',
                E: question.options.E || ''
            };

            // For multipleCorrect questions, extend options to include F-O
            if (question.questionType === 'multipleCorrect') {
                for (let i = 70; i <= 79; i++) { // ASCII for F to O
                    const letter = String.fromCharCode(i);
                    options[letter] = question.options[letter] || '';
                }
            }

            return {
                ...question,
                options
            };
        });

        res.json(processedQuestions);
    } catch (error) {
        console.error('Error parsing questions:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Parse answer key and update questions
exports.parseAnswers = async (req, res) => {
    try {
        const { answerKeyText, part, questionIds } = req.body;

        if (!answerKeyText || !part || !questionIds || !Array.isArray(questionIds)) {
            return res.status(400).json({ message: 'Answer key text, part, and question IDs array are required' });
        }

        // Get the selected questions
        const questions = await Question.find({
            _id: { $in: questionIds },
            part
        });

        if (questions.length === 0) {
            return res.status(404).json({ message: 'No matching questions found' });
        }

        // Parse the answer key
        const answerLines = answerKeyText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const answers = {};
        const multipleCorrectAnswers = {}; // Store question numbers that might have multiple correct answers

        // Regular expressions to match different answer key formats
        const formatRegexes = [
            /^(\d+)[.\s)]+\s*([A-Z])/, // Format: "1. A" or "1) A"
            /^(\d+)\s+([A-Z])/, // Format: "1 A"
            /^([A-Z])[.\s)]+\s*(\d+)/ // Format: "A. 1" or "A) 1"
        ];

        // Try to parse answers using different formats
        answerLines.forEach(line => {
            let matched = false;

            // Try each regex pattern
            for (const regex of formatRegexes) {
                const match = line.match(regex);
                if (match) {
                    let number, answer;
                    if (regex.toString().includes('\\d+)[.\\s)]+\\s*([A-Z')) {
                        // Format: "1. A"
                        number = match[1];
                        answer = match[2];
                    } else if (regex.toString().includes('\\d+\\s+([A-Z')) {
                        // Format: "1 A"
                        number = match[1];
                        answer = match[2];
                    } else {
                        // Format: "A. 1"
                        answer = match[1];
                        number = match[2];
                    }

                    // Handle potential multiple correct answers
                    if (answers[number]) {
                        // If this number already has an answer, it might be multiple-correct
                        if (!multipleCorrectAnswers[number]) {
                            multipleCorrectAnswers[number] = [answers[number]];
                        }
                        multipleCorrectAnswers[number].push(answer);
                    }

                    answers[number] = answer;
                    matched = true;
                    break;
                }
            }

            // Check for space-separated format (like "1 A  2 B  3 C")
            if (!matched) {
                const items = line.split(/\s+/);
                for (let i = 0; i < items.length - 1; i++) {
                    if (/^\d+$/.test(items[i]) && /^[A-Z]$/.test(items[i + 1])) {
                        const number = items[i];
                        const answer = items[i + 1];

                        // Handle potential multiple correct answers
                        if (answers[number]) {
                            if (!multipleCorrectAnswers[number]) {
                                multipleCorrectAnswers[number] = [answers[number]];
                            }
                            multipleCorrectAnswers[number].push(answer);
                        }

                        answers[number] = answer;
                        i++; // Skip the next item since we've used it
                    }
                }
            }
        });

        // Update questions with the parsed answers
        let updatedCount = 0;
        const updatedQuestions = [];

        for (const question of questions) {
            if (answers[question.number]) {
                if (question.questionType === 'multipleCorrect') {
                    // For multipleCorrect questions, use the multipleCorrectAnswers if available
                    if (multipleCorrectAnswers[question.number]) {
                        question.correctAnswers = multipleCorrectAnswers[question.number];
                    } else {
                        // If only one answer found but it's a multipleCorrect question,
                        // just add it to the array
                        question.correctAnswers = [answers[question.number]];
                    }
                } else {
                    // For standard and fourOptions questions
                    question.correctAnswer = answers[question.number];
                }

                await question.save();
                updatedCount++;
                updatedQuestions.push(question);
            }
        }

        res.json({
            updated: updatedCount,
            questions: updatedQuestions,
            multipleCorrectAnswers
        });
    } catch (error) {
        console.error('Error processing answer key:', error);
        res.status(500).json({ message: 'Server error' });
    }
};