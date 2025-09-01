import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes';
// Import other routes as you create them
// import activityRoutes from './routes/activityRoutes';

const app = express();

// CORS configuration for development and production
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://localhost:5173',
    'https://localhost:5174'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.use('/users', userRoutes);
// app.use('/activities', activityRoutes);

export default app;
