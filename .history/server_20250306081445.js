// server.js
// Main server file for PRITE Study Tool Backend

// Import required packages
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

// Initialize Express app
const app = express();

// Define port (use environment variable for production or fallback to 3000)
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses

// Configure CORS for production
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.FRONTEND_URL.split(',')
        : 'http://localhost:5173',
    credentials: true
}));

// Parse JSON and URL-encoded data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files in production (if needed)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static('public'));
}

// Connection to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected successfully!'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit on database connection failure
    });

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/parser', require('./routes/parser'));
// app.use('/api/users', require('./routes/users'));
app.use('/api/claude', require('./routes/claude'));
app.use('/api/users/prite-scores', require('./routes/priteScores'));

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!' });
});

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'up', timestamp: new Date() });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'production' ? null : err.message
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});