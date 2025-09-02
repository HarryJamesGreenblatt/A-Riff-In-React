const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8000;

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'https://a-riff-in-react.azurewebsites.net',
    credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.status(200).json({ 
        message: 'A-Riff-In-React API is running',
        status: 'OK'
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
