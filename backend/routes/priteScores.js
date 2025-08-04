// routes/priteScores.js
const express = require('express');
const router = express.Router();
const priteScoreController = require('../controllers/priteScoreController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// @route   GET api/prite-scores
// @desc    Get all PRITE scores for the current user
// @access  Private
router.get('/', priteScoreController.getUserScores);

// @route   GET api/prite-scores/:id
// @desc    Get a single PRITE score by ID
// @access  Private
router.get('/:id', priteScoreController.getScoreById);

// @route   POST api/prite-scores
// @desc    Create a new PRITE score
// @access  Private
router.post('/', priteScoreController.createScore);

// @route   PUT api/prite-scores/:id
// @desc    Update a PRITE score
// @access  Private
router.put('/:id', priteScoreController.updateScore);

// @route   DELETE api/prite-scores/:id
// @desc    Delete a PRITE score
// @access  Private
router.delete('/:id', priteScoreController.deleteScore);

module.exports = router;