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
            tags,
            year,
            number
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
            isPublic: isPublic || false,
            tags: tags || [],
            year: year || new Date().getFullYear().toString(),
            number: number || "",
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
            tags,
            year,
            number
        } = req.body;

        // Update question fields
        if (text !== undefined) question.text = text;
        if (options !== undefined) question.options = options;
        if (correctAnswer !== undefined) question.correctAnswer = correctAnswer;
        if (explanation !== undefined) question.explanation = explanation;
        if (part !== undefined) question.part = part;
        if (category !== undefined) question.category = category;
        if (isPublic !== undefined) question.isPublic = isPublic;
        if (tags !== undefined) question.tags = tags;
        if (year !== undefined) question.year = year;
        if (number !== undefined) question.number = number;

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

// Create bulk questions
exports.createBulkQuestions = async (req, res) => {
    try {
        const { questions } = req.body;

        if (!questions || !Array.isArray(questions)) {
            return res.status(400).json({ message: 'Questions array is required' });
        }

        // Add creator to each question and ensure all required fields exist
        const questionsWithCreator = questions.map(q => ({
            number: q.number || "",
            part: q.part || "1",
            text: q.text || "",
            options: {
                A: q.options?.A || "",
                B: q.options?.B || "",
                C: q.options?.C || "",
                D: q.options?.D || "",
                E: q.options?.E || ""
            },
            correctAnswer: q.correctAnswer || "",
            explanation: q.explanation || "",
            category: q.category || "",
            isPublic: q.isPublic || false,
            year: q.year || new Date().getFullYear().toString(),
            tags: q.tags || [],
            creator: req.user.id,
            studyData: [{
                user: req.user.id,
                nextReviewDate: new Date()
            }]
        }));

        // Insert all questions
        const result = await Question.insertMany(questionsWithCreator);

        res.status(201).json(result);
    } catch (error) {
        console.error('Bulk creation error:', error);
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
        let query = {};

        // Filter by ownership/visibility
        if (visibility === 'mine') {
            query.creator = req.user.id;
        } else if (visibility === 'public') {
            query.isPublic = true;
        } else {
            // Default: show user's questions and public questions
            query.$or = [
                { creator: req.user.id },
                { isPublic: true }
            ];
        }

        // Add filters if provided
        if (text) {
            // Add text search if MongoDB text index is set up
            // Otherwise, use a simple case-insensitive regex search
            query.$or = [
                { text: { $regex: text, $options: 'i' } },
                { 'options.A': { $regex: text, $options: 'i' } },
                { 'options.B': { $regex: text, $options: 'i' } },
                { 'options.C': { $regex: text, $options: 'i' } },
                { 'options.D': { $regex: text, $options: 'i' } },
                { 'options.E': { $regex: text, $options: 'i' } },
                { explanation: { $regex: text, $options: 'i' } }
            ];
        }

        if (part) {
            query.part = part;
        }

        if (category) {
            query.category = category;
        }

        const questions = await Question.find(query).sort({ createdAt: -1 });
        res.json(questions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};