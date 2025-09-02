"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const app = (0, express_1.default)();
const port = process.env.PORT || 8000;
// Middleware
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://a-riff-in-react.azurewebsites.net'
    ],
    credentials: true
}));
app.use(express_1.default.json());
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'A-Riff-In-React API'
    });
});
// API routes
app.use('/users', userRoutes_1.default);
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
exports.default = app;
