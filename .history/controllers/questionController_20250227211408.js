// controllers/questionController.js
const Question = require('../models/Question');

// Get all questions for current user (including public ones)
exports.getQuestions = async (req, res) => {
    try {
        // Find questions created by user and public questions
        const questions = await Question.find({
            $or: [
                { creator: req.user.id },
                { isPublic: true }
            ]
        }).sort({ createdAt: -1 });

        res.json(questions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get questions due for review today
exports.getDueQuestions = async (req, res) => {
    try {
        const today = new Date();

        // Find questions with study data for current user where nextReviewDate <= today
        const questions = await Question.find({
            $or: [
                { creator: req.user.id },
                { isPublic: true }
            ],
            'studyData.user': req.user.id,
            'studyData.nextReviewDate': { $lte: today }
        });

        res.json(questions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get question by ID
exports.getQuestionById = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);

        // Check if question exists
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        // Check if user has access to this question
        if (!question.isPublic && question.creator.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to access this question' });
        }

        res.json(question);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create a new question
exports.createQuestion = async (req, res) => {
    try {
        const {
            text,
            options,
            correctAnswer,
            explanation,
            part,
            category,
            isPublic,
            tags
        } = req.body;

        // Create new question
        const newQuestion = new Question({
            creator: req.user.id,
            text,
            options,
            correctAnswer,
            explanation,
            part,
            category,
            isPublic,
            tags,
            // Initialize study data for creator
            studyData: [{
                user: req.user.id,
                nextReviewDate: new Date()
            }]
        });

        const question = await newQuestion.save();
        res.status(201).json(question);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update a question
exports.updateQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);

        // Check if question exists
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        // Check if user owns the question
        if (question.creator.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this question' });
        }

        // Fields to update
        const {
            text,
            options,
            correctAnswer,
            explanation,
            part,
            category,
            isPublic,
            tags
        } = req.body;

        // Update question fields
        if (text) question.text = text;
        if (options) question.options = options;
        if (correctAnswer) question.correctAnswer = correctAnswer;
        if (explanation) question.explanation = explanation;
        if (part) question.part = part;
        if (category) question.category = category;
        if (isPublic !== undefined) question.isPublic = isPublic;
        if (tags) question.tags = tags;

        // Save updated question
        const updatedQuestion = await question.save();
        res.json(updatedQuestion);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a question
exports.deleteQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);

        // Check if question exists
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        // Check if user owns the question
        if (question.creator.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this question' });
        }

        await question.remove();
        res.json({ message: 'Question removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update study data after reviewing a question
exports.updateStudyData = async (req, res) => {
    try {
        const { difficulty } = req.body; // 0=hard, 1=medium, 2=easy
        const question = await Question.findById(req.params.id);

        // Check if question exists
        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        // Find the user's study data for this question
        let studyData = question.studyData.find(
            data => data.user.toString() === req.user.id
        );

        // If no study data exists for this user, create it
        if (!studyData) {
            studyData = {
                user: req.user.id,
                interval: 0,
                easeFactor: 2.5,
                repetitions: 0,
                reviewedDate: new Date(),
                nextReviewDate: new Date()
            };
            question.studyData.push(studyData);
        } else {
            // Get the index of the user's study data
            const index = question.studyData.findIndex(
                data => data.user.toString() === req.user.id
            );

            // Update using SuperMemo SM-2 algorithm
            const quality = parseInt(difficulty);

            // Calculate new ease factor
            studyData.easeFactor = Math.max(
                1.3,
                studyData.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
            );

            // Calculate interval
            if (quality < 3) {
                studyData.repetitions = 0;
                studyData.interval = 1;
            } else {
                studyData.repetitions++;
                if (studyData.repetitions === 1) {
                    studyData.interval = 1;
                } else if (studyData.repetitions === 2) {
                    studyData.interval = 6;
                } else {
                    studyData.interval = Math.round(studyData.interval * studyData.easeFactor);
                }
            }

            // Update review dates
            studyData.reviewedDate = new Date();
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + studyData.interval);
            studyData.nextReviewDate = nextDate;

            // Update in the array
            question.studyData[index] = studyData;
        }

        await question.save();
        res.json(question);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Search questions
exports.searchQuestions = async (req, res) => {
    try {
        const { text, part, category, visibility } = req.query;

        // Build query
        const query = {
            $or: [
                { creator: req.user.id },
                { isPublic: true }
            ]
        };

        // Add filters if provided
        if (text) {
            query.$text = { $search: text };
        }

        if (part) {
            query.part = part;
        }

        if (category) {
            query.category = category;
        }

        // Filter by visibility if specified
        if (visibility === 'mine') {
            query.$or = [{ creator: req.user.id }];
        } else if (visibility === 'public') {
            query.$or = [{ isPublic: true }];
        }

        const questions = await Question.find(query).sort({ createdAt: -1 });
        res.json(questions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};