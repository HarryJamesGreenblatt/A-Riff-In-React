"use strict";

const express = require('express');
const router = express.Router();

// Try to initialize Cosmos DB client, but don't fail if it's not available
let cosmosClient, database, container;
try {
    const { CosmosClient } = require('@azure/cosmos');
    
    // Cosmos DB client setup
    cosmosClient = new CosmosClient({
        endpoint: process.env.COSMOS_ENDPOINT || '',
        key: process.env.COSMOS_KEY || '',
    });
    
    if (process.env.COSMOS_DATABASE) {
        database = cosmosClient.database(process.env.COSMOS_DATABASE);
        container = database.container('activity-logs');
        console.log('Cosmos DB client initialized successfully');
    } else {
        console.warn('COSMOS_DATABASE environment variable not set, Cosmos DB features disabled');
    }
} catch (error) {
    console.error('Failed to initialize Cosmos DB client:', error.message);
    console.error('Cosmos DB features will be unavailable');
}

// Helper function to check if Cosmos DB is available
function isCosmosAvailable() {
    return !!(cosmosClient && database && container);
}

// GET /api/activities
router.get('/', function(req, res) {
    try {
        if (!isCosmosAvailable()) {
            return res.status(503).json({ 
                message: 'Activity service unavailable',
                status: 'COSMOS_DB_UNAVAILABLE'
            });
        }
        
        var userId = req.query.userId;
        var limit = req.query.limit || '50';
        var query = 'SELECT * FROM c ORDER BY c.timestamp DESC';
        var parameters = [];
        
        if (userId) {
            query = 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.timestamp DESC';
            parameters.push({ name: '@userId', value: userId });
        }
        
        if (limit) {
            query += ' OFFSET 0 LIMIT ' + parseInt(limit);
        }
        
        container.items.query({
            query: query,
            parameters: parameters
        }).fetchAll().then(function(response) {
            res.status(200).json(response.resources);
        }).catch(function(err) {
            console.error('Error fetching activities:', err);
            res.status(500).json({ error: err.message });
        });
    }
    catch (err) {
        console.error('Error in activities route:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/activities/stream
router.get('/stream', function(req, res) {
    try {
        if (!isCosmosAvailable()) {
            return res.status(503).json({ 
                message: 'Activity stream service unavailable',
                status: 'COSMOS_DB_UNAVAILABLE'
            });
        }
        
        // For now, return recent activities
        // This could be enhanced with WebSocket support for real-time updates
        var query = 'SELECT * FROM c ORDER BY c.timestamp DESC OFFSET 0 LIMIT 20';
        container.items.query(query).fetchAll().then(function(response) {
            res.status(200).json(response.resources);
        }).catch(function(err) {
            console.error('Error fetching activity stream:', err);
            res.status(500).json({ error: err.message });
        });
    }
    catch (err) {
        console.error('Error in activity stream route:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/activities
router.post('/', function(req, res) {
    try {
        if (!isCosmosAvailable()) {
            return res.status(503).json({ 
                message: 'Activity logging service unavailable',
                status: 'COSMOS_DB_UNAVAILABLE'
            });
        }
        
        var userId = req.body.userId;
        var type = req.body.type;
        var data = req.body.data;
        var metadata = req.body.metadata;
        
        if (!userId || !type) {
            return res.status(400).json({ message: 'userId and type are required' });
        }
        
        var activity = {
            id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            userId: userId,
            type: type,
            data: data || {},
            timestamp: new Date().toISOString(),
            metadata: metadata || {}
        };
        
        container.items.create(activity).then(function(response) {
            res.status(201).json(response.resource);
        }).catch(function(err) {
            console.error('Error creating activity:', err);
            res.status(500).json({ error: err.message });
        });
    }
    catch (err) {
        console.error('Error in activity creation route:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
