// routes/users.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Question = require('../models/Question');

// All routes require authentication
router.use(auth);

// @route   GET api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', async (req, res) => {
    try {
        const {
            displayName,
            email,
            pgyLevel,
            specialty,
            institution,
            onboardingStep,
            onboardingComplete
        } = req.body;

        // Find user by ID
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update fields if provided
        if (displayName) user.displayName = displayName;
        if (email) user.email = email;
        if (pgyLevel !== undefined) user.pgyLevel = pgyLevel;
        if (specialty) user.specialty = specialty;
        if (institution) user.institution = institution;
        if (onboardingStep !== undefined) user.onboardingStep = onboardingStep;
        if (onboardingComplete !== undefined) user.onboardingComplete = onboardingComplete;

        await user.save();

        // Return updated user without password
        const updatedUser = await User.findById(req.user.id).select('-password');
        res.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   PUT api/users/settings
// @desc    Update user settings
// @access  Private
router.put('/settings', async (req, res) => {
    try {
        const { settings } = req.body;

        // Find user by ID
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update settings
        user.settings = settings;
        await user.save();

        // If publicProfile setting changed, update all user's questions
        if (settings.publicProfile !== undefined) {
            await Question.updateMany(
                { creator: req.user.id },
                { isPublic: settings.publicProfile }
            );
        }

        // Return updated user without password
        const updatedUser = await User.findById(req.user.id).select('-password');
        res.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET api/users/export/study-data
// @desc    Export user's study data
// @access  Private
router.get('/export/study-data', async (req, res) => {
    try {
        // Get all questions with study data for this user
        const questions = await Question.find({
            'studyData.user': req.user.id
        });

        // Extract study data for the user
        const studyData = questions.map(question => {
            const userData = question.studyData.find(
                data => data.user.toString() === req.user.id
            );

            return {
                questionId: question._id,
                questionText: question.text,
                part: question.part,
                category: question.category,
                studyData: userData
            };
        });

        res.json({ success: true, data: studyData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET api/users/export/questions
// @desc    Export questions created by the user
// @access  Private
router.get('/export/questions', async (req, res) => {
    try {
        // Get all questions created by this user
        const questions = await Question.find({ creator: req.user.id });

        res.json({ success: true, questions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST api/users/reset-study-progress
// @desc    Reset user's study progress
// @access  Private
router.post('/reset-study-progress', async (req, res) => {
    try {
        // Find all questions with study data for this user
        const questions = await Question.find({
            'studyData.user': req.user.id
        });

        // Reset study data for each question
        for (const question of questions) {
            // Find the index of the user's study data
            const index = question.studyData.findIndex(
                data => data.user.toString() === req.user.id
            );

            if (index !== -1) {
                // Reset to initial values
                question.studyData[index] = {
                    user: req.user.id,
                    interval: 0,
                    easeFactor: 2.5,
                    repetitions: 0,
                    reviewedDate: new Date(),
                    nextReviewDate: new Date()
                };

                await question.save();
            }
        }

        res.json({ success: true, message: 'Study progress reset successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   DELETE api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', async (req, res) => {
    try {
        // Delete user's questions (optional - you may want to keep these)
        // await Question.deleteMany({ creator: req.user.id });

        // Remove user's study data from questions
        await Question.updateMany(
            { 'studyData.user': req.user.id },
            { $pull: { studyData: { user: req.user.id } } }
        );

        // Delete user
        await User.findByIdAndRemove(req.user.id);

        res.json({ success: true, message: 'Account deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;