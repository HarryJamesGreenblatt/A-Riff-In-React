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
const database_1 = require("../services/database");
const router = (0, express_1.Router)();
// GET /api/users
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pool = yield (0, database_1.getDbPool)();
        const result = yield pool.request().query('SELECT * FROM Users');
        res.status(200).json(result.recordset);
    }
    catch (err) {
        const error = err;
        res.status(500).json({ error: error.message });
    }
}));
// GET /api/users/email/:email
router.get('/email/:email', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.params;
    try {
        const pool = yield (0, database_1.getDbPool)();
        const result = yield pool.request()
            .input('email', email)
            .query('SELECT * FROM Users WHERE email = @email');
        if (result.recordset.length > 0) {
            res.status(200).json(result.recordset[0]);
        }
        else {
            res.status(404).json({ message: 'User not found' });
        }
    }
    catch (err) {
        const error = err;
        res.status(500).json({ error: error.message });
    }
}));
// POST /api/users
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email } = req.body;
    if (!name || !email) {
        return res.status(400).json({ message: 'Name and email are required' });
    }
    try {
        const pool = yield (0, database_1.getDbPool)();
        // Check if user already exists
        const existingUser = yield pool.request()
            .input('email', email)
            .query('SELECT * FROM Users WHERE email = @email');
        if (existingUser.recordset.length > 0) {
            // User exists, return 409 Conflict and the existing user
            return res.status(409).json(existingUser.recordset[0]);
        }
        // User does not exist, create new user
        const result = yield pool.request()
            .input('name', name)
            .input('email', email)
            .query('INSERT INTO Users (name, email) OUTPUT INSERTED.* VALUES (@name, @email)');
        res.status(201).json(result.recordset[0]);
    }
    catch (err) {
        const error = err;
        res.status(500).json({ error: error.message });
    }
}));
exports.default = router;
