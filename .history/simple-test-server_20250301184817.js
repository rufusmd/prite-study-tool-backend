// Create a new file called test-server.js
const express = require('express');
const app = express();
const PORT = 3001; // Use a different port

app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
    console.log('Test route hit!');
    res.json({ message: 'API is working!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Test server running on port ${PORT}`);
});