// routes/questions.js
const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Create a question
router.post('/', questionController.createQuestion);

// Get user's questions (including public ones)
router.get('/', questionController.getUserQuestions);

// Get questions due for review
router.get('/due', questionController.getDueQuestions);

// Update a question
router.put('/:id', questionController.updateQuestion);

// Update study data after reviewing
router.patch('/:id/study', questionController.updateStudyData);

// Delete a question
router.delete('/:id', questionController.deleteQuestion);

module.exports = router;