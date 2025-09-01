import { Router } from 'express';
import { CosmosClient } from '@azure/cosmos';

const router = Router();

// Cosmos DB client setup
const cosmosClient = new CosmosClient({
  endpoint: process.env.COSMOS_ENDPOINT || '',
  key: process.env.COSMOS_KEY || '',
});

const database = cosmosClient.database(process.env.COSMOS_DATABASE || '');
const container = database.container('activity-logs');

// GET /api/activities
router.get('/', async (req, res) => {
    try {
        const { userId, limit = '50' } = req.query;
        
        let query = 'SELECT * FROM c ORDER BY c.timestamp DESC';
        const parameters: { name: string; value: string }[] = [];
        
        if (userId) {
            query = 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.timestamp DESC';
            parameters.push({ name: '@userId', value: userId as string });
        }
        
        if (limit) {
            query += ` OFFSET 0 LIMIT ${parseInt(limit as string)}`;
        }
        
        const { resources } = await container.items.query({
            query,
            parameters
        }).fetchAll();
        
        res.status(200).json(resources);
    } catch (err) {
        const error = err as Error;
        console.error('Error fetching activities:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/activities/stream
router.get('/stream', async (req, res) => {
    try {
        // For now, return recent activities
        // This could be enhanced with WebSocket support for real-time updates
        const query = 'SELECT * FROM c ORDER BY c.timestamp DESC OFFSET 0 LIMIT 20';
        
        const { resources } = await container.items.query(query).fetchAll();
        
        res.status(200).json(resources);
    } catch (err) {
        const error = err as Error;
        console.error('Error fetching activity stream:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/activities
router.post('/', async (req, res) => {
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

        const { resource } = await container.items.create(activity);
        
        res.status(201).json(resource);
    } catch (err) {
        const error = err as Error;
        console.error('Error creating activity:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
