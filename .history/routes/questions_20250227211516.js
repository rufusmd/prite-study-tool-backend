// routes/questions.js
const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const auth = require('../middleware/auth');

// Apply auth middleware to all question routes
router.use(auth);

// @route   GET api/questions
// @desc    Get all questions for user (including public)
// @access  Private
router.get('/', questionController.getQuestions);

// @route   GET api/questions/due
// @desc    Get questions due for review
// @access  Private
router.get('/due', questionController.getDueQuestions);

// @route   GET api/questions/search
// @desc    Search questions
// @access  Private
router.get('/search', questionController.searchQuestions);

// @route   GET api/questions/:id
// @desc    Get question by ID
// @access  Private
router.get('/:id', questionController.getQuestionById);

// @route   POST api/questions
// @desc    Create a new question
// @access  Private
router.post('/', questionController.createQuestion);

// @route   PUT api/questions/:id
// @desc    Update a question
// @access  Private
router.put('/:id', questionController.updateQuestion);

// @route   DELETE api/questions/:id
// @desc    Delete a question
// @access  Private
router.delete('/:id', questionController.deleteQuestion);

// @route   PATCH api/questions/:id/study
// @desc    Update study data after reviewing
// @access  Private
router.patch('/:id/study', questionController.updateStudyData);

module.exports = router;