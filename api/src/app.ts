import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes';
// Import other routes as you create them
// import activityRoutes from './routes/activityRoutes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
// app.use('/api/activities', activityRoutes);

export default app;
