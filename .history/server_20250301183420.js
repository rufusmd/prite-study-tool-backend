// Update server.js
const express = require('express');
const mongoose = require('mongoose');
const path = require('path'); // Add this line
const cors = require('cors');
require('dotenv').config();
console.log('Environment variables loaded');
const claudeRoutes = require('./routes/claude');
// In server.js
let claudeRoutes;
try {
    claudeRoutes = require('./routes/claude');
} catch (error) {
    console.error('Failed to load Claude routes:', error.message);
    process.exit(1); // Exit or handle appropriately
}

const app = express();
const PORT = process.env.PORT || 3000; // Changed from 5000 to 3000

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/parser', require('./routes/parser'));
app.use('/api/claude', claudeRoutes);
// In server.js after registering routes
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

// Check if MongoDB URI is defined
if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not defined in environment variables!');
    console.error('Please check your .env file and ensure it contains MONGODB_URI');
    process.exit(1); // Exit the process with an error code
}

// Log MongoDB connection attempt
console.log('Attempting to connect to MongoDB...');

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB successfully!');
    })
    .catch(err => {
        console.error('MongoDB connection error:');
        console.error(err);
    });

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});