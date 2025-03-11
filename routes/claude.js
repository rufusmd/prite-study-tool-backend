// routes/claude.js
const express = require('express');
const axios = require('axios');
const router = express.Router();
const claudeController = require('../controllers/claudeController');

// Simple test route that doesn't require auth
router.get('/test', (req, res) => {
    console.log('Claude test endpoint hit');
    res.json({ message: 'Claude route is working!' });
});

// Main processing endpoint
router.post('/', claudeController.processText);

router.post('/process-text', claudeController.processText);

router.post('/explanation', claudeController.explanationLimiter, claudeController.generateExplanation);

module.exports = router;