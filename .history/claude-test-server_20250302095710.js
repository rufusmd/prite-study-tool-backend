const express = require('express');
const app = express();
const PORT = 3000;

// Log all requests
app.use((req, res, next) => {
    console.log(`Request received: ${req.method} ${req.path}`);
    next();
});

// Basic test endpoint
app.get('/api/test', (req, res) => {
    console.log('Test endpoint hit');
    res.json({ message: 'Simple test server is working!' });
});

// Root endpoint
app.get('/', (req, res) => {
    console.log('Root endpoint hit');
    res.send('Simple test server root endpoint');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Simple test server running on port ${PORT}`);
});