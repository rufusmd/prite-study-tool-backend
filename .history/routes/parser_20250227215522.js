const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const parserController = require('../controllers/parserController');

// All routes require authentication
router.use(auth);

// @route   POST api/parser/questions
// @desc    Parse OCR text into question objects
// @access  Private
router.post('/questions', parserController.parseQuestions);

// @route   POST api/parser/answers
// @desc    Parse answer key and update questions
// @access  Private
router.post('/answers', parserController.parseAnswers);

module.exports = router;