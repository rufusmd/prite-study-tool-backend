// controllers/questionController.js
const Question = require('../models/Question');

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
            number,
            isPublic,
            tags
        } = req.body;

        const question = new Question({
            creator: req.user.id,
            text,
            options,
            correctAnswer,
            explanation,
            part,
            category,
            number,
            isPublic,
            tags,
            // Initialize study data for the creator
            studyData: [{
                user: req.user.id,
                nextReviewDate: new Date()
            }]
        });

        await question.save();
        res.status(201).json(question);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get questions for the current user
exports.getUserQuestions = async (req, res) => {
    try {
        const questions = await Question.find({
            $or: [
                { creator: req.user.id },
                { isPublic: true }
            ]
        }).sort({ createdAt: -1 });

        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get questions due for review today (spaced repetition)
exports.getDueQuestions = async (req, res) => {
    try {
        const today = new Date();

        const questions = await Question.find({
            'studyData.user': req.user.id,
            'studyData.nextReviewDate': { $lte: today }
        });

        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update a question
exports.updateQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);

        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        // Check ownership
        if (question.creator.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this question' });
        }

        // Update fields
        const updatedFields = { ...req.body };

        // Remove fields that shouldn't be directly updated
        delete updatedFields.creator;
        delete updatedFields.studyData;
        delete updatedFields.ratings;

        const updatedQuestion = await Question.findByIdAndUpdate(
            req.params.id,
            { $set: updatedFields },
            { new: true }
        );

        res.json(updatedQuestion);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update study data (after reviewing a question)
exports.updateStudyData = async (req, res) => {
    try {
        const { difficulty } = req.body; // 0=hard, 1=medium, 2=easy
        const question = await Question.findById(req.params.id);

        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        // Find user's study data for this question
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
            // Find the index
            const index = question.studyData.findIndex(
                data => data.user.toString() === req.user.id
            );

            // Update using SM-2 algorithm
            const quality = difficulty;

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

            // Update in array
            question.studyData[index] = studyData;
        }

        await question.save();
        res.json(question);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete a question
exports.deleteQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);

        if (!question) {
            return res.status(404).json({ message: 'Question not found' });
        }

        // Check ownership
        if (question.creator.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this question' });
        }

        await question.remove();
        res.json({ message: 'Question deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};