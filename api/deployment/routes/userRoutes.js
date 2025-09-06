"use strict";

const express = require('express');
const database = require('../services/database');
const router = express.Router();

// Helper function to handle database errors
function handleDatabaseError(err, res) {
    console.error('Database error:', err.message);
    
    if (err.message === 'SQL_DATABASE_UNAVAILABLE' || err.message === 'SQL_CONNECTION_FAILED') {
        return res.status(503).json({
            message: 'User database service unavailable',
            status: 'SQL_DATABASE_UNAVAILABLE'
        });
    }
    
    return res.status(500).json({ error: err.message });
}

// GET /api/users
router.get('/', function(req, res) {
    database.getDbPool()
        .then(function(pool) {
            return pool.request().query('SELECT * FROM Users');
        })
        .then(function(result) {
            res.status(200).json(result.recordset);
        })
        .catch(function(err) {
            handleDatabaseError(err, res);
        });
});
// GET /api/users/email/:email
router.get('/email/:email', function(req, res) {
    var email = req.params.email;
    database.getDbPool()
        .then(function(pool) {
            return pool.request()
                .input('email', email)
                .query('SELECT * FROM Users WHERE email = @email');
        })
        .then(function(result) {
            if (result.recordset.length > 0) {
                res.status(200).json(result.recordset[0]);
            }
            else {
                res.status(404).json({ message: 'User not found' });
            }
        })
        .catch(function(err) {
            handleDatabaseError(err, res);
        });
});
// POST /api/users
router.post('/', function(req, res) {
    var name = req.body.name;
    var email = req.body.email;
    if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required' });
    }
    
    var pool;
    database.getDbPool()
        .then(function(dbPool) {
            pool = dbPool;
            // Check if user already exists
            return pool.request()
                .input('email', email)
                .query('SELECT * FROM Users WHERE email = @email');
        })
        .then(function(existingUser) {
            if (existingUser.recordset.length > 0) {
                // User exists, return 409 Conflict and the existing user
                return res.status(409).json(existingUser.recordset[0]);
            }
            
            // User does not exist, create new user
            return pool.request()
                .input('name', name)
                .input('email', email)
                .query('INSERT INTO Users (name, email) OUTPUT INSERTED.* VALUES (@name, @email)');
        })
        .then(function(result) {
            if (result && result.recordset) {
                res.status(201).json(result.recordset[0]);
            }
        })
        .catch(function(err) {
            handleDatabaseError(err, res);
        });
});

module.exports = router;
