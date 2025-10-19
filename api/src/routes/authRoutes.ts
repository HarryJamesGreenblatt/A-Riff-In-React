import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth';
import { query } from '../services/sqlService';

const router = express.Router();
const SALT_ROUNDS = 10;

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, phone } = req.body;

    // Validation
    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM Users WHERE email = @email',
      { email }
    );

    if (existingUser.recordset.length > 0) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user (include phone if provided)
    const result = await query(
      `INSERT INTO Users (email, passwordHash, name, role, phone, createdAt, updatedAt)
       OUTPUT INSERTED.id, INSERTED.email, INSERTED.name, INSERTED.role, INSERTED.phone, INSERTED.createdAt
       VALUES (@email, @passwordHash, @name, 'member', @phone, GETUTCDATE(), GETUTCDATE())`,
      { email, passwordHash, name, phone: phone || null }
    );

    const user = result.recordset[0];

    res.status(201).json({
      success: true,
      user: {
        id: String(user.id), // Ensure ID is string
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Find user
    const result = await query(
      'SELECT id, email, passwordHash, name, role, phone FROM Users WHERE email = @email',
      { email }
    );

    if (result.recordset.length === 0) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const user = result.recordset[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Ensure userId is a string (convert UNIQUEIDENTIFIER to string)
    const userId = String(user.id);

    // Generate JWT token
    const token = generateToken(userId, user.email);

    res.status(200).json({
      token,
      user: {
        id: userId,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Get full user details
    const result = await query(
      'SELECT id, email, name, role, phone, createdAt FROM Users WHERE id = @userId',
      { userId: req.user.userId }
    );

    if (result.recordset.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = result.recordset[0];

    res.status(200).json({
      user: {
        id: String(user.id),
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
