// routes/explanation.js
const express = require('express');
const router = express.Router();
const explanationController = require('../controllers/explanationController');
const auth = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(auth);

// Generate explanation endpoint with rate limiting
router.post('/generate',
    explanationController.explanationLimiter,
    explanationController.generateExplanation
);

module.exports = router;