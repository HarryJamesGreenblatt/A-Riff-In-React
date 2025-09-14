import express from 'express';
import { sqlService } from '../services/sqlService';

const router = express.Router();

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const users = await sqlService.getUsers();
    res.status(200).json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await sqlService.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Failed to retrieve user' });
  }
});

// POST /api/users
router.post('/', async (req, res) => {
  try {
    const { firstName, lastName, phone, email } = req.body;
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ message: 'First name, last name, and email are required' });
    }
    const user = await sqlService.createUser({ firstName, lastName, phone, email });
    res.status(201).json(user);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

export default router;
