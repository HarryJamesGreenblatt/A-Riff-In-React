import { Router } from 'express';
import { getDbPool } from '../services/database';

const router = Router();

// Simple test endpoint to verify routing works
router.get('/test', async (req, res) => {
    res.status(200).json({ message: 'User route test works!', timestamp: new Date().toISOString() });
});

// GET /api/users
router.get('/', async (req, res) => {
    try {
        console.log('Attempting to get database pool...');
        const pool = await getDbPool();
        console.log('Database pool obtained successfully');
        
        console.log('Executing query...');
        const result = await pool.request().query('SELECT * FROM Users');
        console.log('Query executed successfully, rows:', result.recordset.length);
        
        res.status(200).json(result.recordset);
    } catch (err) {
        const error = err as Error;
        console.error('Error in users route:', error.message);
        console.error('Full error:', error);
        res.status(500).json({ 
            error: error.message,
            stack: error.stack,
            name: error.name
        });
    }
});

// GET /api/users/email/:email
router.get('/email/:email', async (req, res) => {
    const { email } = req.params;
    try {
        const pool = await getDbPool();
        const result = await pool.request()
            .input('email', email)
            .query('SELECT * FROM Users WHERE email = @email');
        
        if (result.recordset.length > 0) {
            res.status(200).json(result.recordset[0]);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        const error = err as Error;
        res.status(500).json({ error: error.message });
    }
});

// POST /api/users
router.post('/', async (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required' });
    }

    try {
        const pool = await getDbPool();
        
        // Check if user already exists
        const existingUser = await pool.request()
            .input('email', email)
            .query('SELECT * FROM Users WHERE email = @email');

        if (existingUser.recordset.length > 0) {
            // User exists, return 409 Conflict and the existing user
            return res.status(409).json(existingUser.recordset[0]);
        }

        // User does not exist, create new user
        const result = await pool.request()
            .input('name', name)
            .input('email', email)
            .query('INSERT INTO Users (name, email) OUTPUT INSERTED.* VALUES (@name, @email)');
        
        res.status(201).json(result.recordset[0]);

    } catch (err) {
        const error = err as Error;
        res.status(500).json({ error: error.message });
    }
});

export default router;
