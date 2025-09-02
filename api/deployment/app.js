"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
// Import other routes as you create them
// import activityRoutes from './routes/activityRoutes';
const app = (0, express_1.default)();
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
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.json());
// Routes
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});
app.use('/users', userRoutes_1.default);
// app.use('/activities', activityRoutes);
exports.default = app;
