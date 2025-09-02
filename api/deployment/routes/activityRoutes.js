"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cosmos_1 = require("@azure/cosmos");
const router = (0, express_1.Router)();
// Cosmos DB client setup
const cosmosClient = new cosmos_1.CosmosClient({
    endpoint: process.env.COSMOS_ENDPOINT || '',
    key: process.env.COSMOS_KEY || '',
});
const database = cosmosClient.database(process.env.COSMOS_DATABASE || '');
const container = database.container('activity-logs');
// GET /api/activities
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, limit = '50' } = req.query;
        let query = 'SELECT * FROM c ORDER BY c.timestamp DESC';
        const parameters = [];
        if (userId) {
            query = 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.timestamp DESC';
            parameters.push({ name: '@userId', value: userId });
        }
        if (limit) {
            query += ` OFFSET 0 LIMIT ${parseInt(limit)}`;
        }
        const { resources } = yield container.items.query({
            query,
            parameters
        }).fetchAll();
        res.status(200).json(resources);
    }
    catch (err) {
        const error = err;
        console.error('Error fetching activities:', error);
        res.status(500).json({ error: error.message });
    }
}));
// GET /api/activities/stream
router.get('/stream', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // For now, return recent activities
        // This could be enhanced with WebSocket support for real-time updates
        const query = 'SELECT * FROM c ORDER BY c.timestamp DESC OFFSET 0 LIMIT 20';
        const { resources } = yield container.items.query(query).fetchAll();
        res.status(200).json(resources);
    }
    catch (err) {
        const error = err;
        console.error('Error fetching activity stream:', error);
        res.status(500).json({ error: error.message });
    }
}));
// POST /api/activities
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId, type, data, metadata } = req.body;
        if (!userId || !type) {
            return res.status(400).json({ message: 'userId and type are required' });
        }
        const activity = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            userId,
            type,
            data: data || {},
            timestamp: new Date().toISOString(),
            metadata: metadata || {}
        };
        const { resource } = yield container.items.create(activity);
        res.status(201).json(resource);
    }
    catch (err) {
        const error = err;
        console.error('Error creating activity:', error);
        res.status(500).json({ error: error.message });
    }
}));
exports.default = router;
