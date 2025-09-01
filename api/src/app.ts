import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes';
import activityRoutes from './routes/activityRoutes';

const app = express();

// CORS configuration for development and production
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://localhost:5173',
    'https://localhost:5174',
    'https://a-riff-in-react.azurewebsites.net',
    'https://app-a-riff-in-react.azurewebsites.net'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Test endpoint to check environment variables
app.get('/test', (req, res) => {
  res.json({
    environment: process.env.NODE_ENV || 'development',
    hasConnectionString: !!process.env.SQL_CONNECTION_STRING,
    connectionStringStart: process.env.SQL_CONNECTION_STRING ? process.env.SQL_CONNECTION_STRING.substring(0, 50) + '...' : 'Not found'
  });
});

// Routes - Since Azure Function already handles the /api prefix,
// we mount the routes directly at /users and /activities
app.use('/users', userRoutes);
app.use('/activities', activityRoutes);

export default app;
