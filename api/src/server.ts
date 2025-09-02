import express from 'express';
import cors from 'cors';
import userRoutes from './routes/userRoutes';

const app = express();
const port = process.env.PORT || 8000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://a-riff-in-react.azurewebsites.net'
  ],
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'A-Riff-In-React API'
  });
});

// API routes
app.use('/users', userRoutes);

// Default route
app.get('/', (req, res) => {
  res.json({ 
    message: 'A-Riff-In-React API is running',
    version: '1.0.0'
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📍 Health check: http://localhost:${port}/health`);
});

export default app;
