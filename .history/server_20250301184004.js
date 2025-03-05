// Update server.js
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
require('dotenv').config();
console.log('Environment variables loaded');

// Import routes with error handling
let claudeRoutes;
try {
    claudeRoutes = require('./routes/claude');
    console.log('Claude routes loaded successfully');
} catch (error) {
    console.error('Failed to load Claude routes:', error.message);
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));  // Increased limit for potentially large text
app.use(express.static('public'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/parser', require('./routes/parser'));
app.use('/api/claude', claudeRoutes);

// Debug route registrations
console.log('Routes registered:');
app._router.stack.forEach((r) => {
    if (r.route && r.route.path) {
        console.log(`${Object.keys(r.route.methods)} ${r.route.path}`);
    } else if (r.name === 'router') {
        r.handle.stack.forEach((layer) => {
            if (layer.route) {
                const fullPath = r.regexp.toString().split('/')[1].replace('\\', '');
                console.log(`${Object.keys(layer.route.methods)} /${fullPath}${layer.route.path}`);
            }
        });
    }
});

// Serve the main app
app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// MongoDB connection
if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not defined in environment variables!');
    process.exit(1);
}

console.log('Attempting to connect to MongoDB...');
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB successfully!');
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});