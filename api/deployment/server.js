const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8080; // Use Azure's assigned port or fallback to 8080

// Set port for iisnode compatibility
app.set('port', port);

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'https://a-riff-in-react.azurewebsites.net',
    credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
    // Return health status regardless of database connectivity
    // This ensures the health check always succeeds so the app doesn't get restarted unnecessarily
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        services: {
            sql: process.env.AZURE_SQL_CONNECTIONSTRING ? 'Configured' : 'Not Configured',
            cosmos: process.env.COSMOS_ENDPOINT && process.env.COSMOS_KEY ? 'Configured' : 'Not Configured'
        }
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.status(200).json({ 
        message: 'A-Riff-In-React API is running',
        status: 'OK'
    });
});

// Diagnostic log to check environment variables
console.log('--- DIAGNOSTIC: Checking Environment Variables ---');
console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL}`);
console.log(`AZURE_SQL_CONNECTIONSTRING: ${process.env.AZURE_SQL_CONNECTIONSTRING ? 'Exists (hidden for security)' : 'NOT FOUND'}`);
console.log('----------------------------------------------');

// Import and use routes (only if dependencies are available)
try {
    const userRoutes = require('./routes/userRoutes');
    const activityRoutes = require('./routes/activityRoutes');
    
    // Check if using default export (TypeScript/ES6 pattern) or CommonJS module.exports
    app.use('/api/users', userRoutes.default || userRoutes);
    app.use('/api/activities', activityRoutes.default || activityRoutes);
    
    console.log('Database routes loaded successfully');
} catch (error) {
    console.error('--- CRITICAL: Failed to load database routes ---');
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    console.error('-------------------------------------------------');
    console.log('API running in basic mode - database features disabled');
}

// Start server - Remove callback for iisnode compatibility
app.listen(port);
console.log('Server listening on port ' + port);

module.exports = app;
