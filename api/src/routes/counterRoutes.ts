import express from 'express';
import { cosmosService } from '../services/cosmosService';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/counter
 * Get the current user's counter value
 * Requires authentication
 */
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const counter = await cosmosService.getUserCounter(req.user.userId);
    res.status(200).json(counter);
  } catch (err: any) {
    // Improved logging
    console.error('Error fetching counter:', err?.stack || err);

    // In non-production include error details to help debugging
    const details = process.env.NODE_ENV === 'production' ? undefined : String(err?.message || err);
    res.status(500).json({ error: 'Failed to retrieve counter', details });
  }
});

/**
 * POST /api/counter/increment
 * Increment the current user's counter
 * Body: { amount?: number } (defaults to 1)
 * Requires authentication
 */
router.post('/increment', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { amount = 1 } = req.body;

    // Validate amount
    if (typeof amount !== 'number' || amount < 1 || amount > 1000) {
      return res.status(400).json({ error: 'Amount must be between 1 and 1000' });
    }

    const counter = await cosmosService.incrementUserCounter(req.user.userId, amount);
    res.status(200).json(counter);
  } catch (err: any) {
    console.error('Error incrementing counter:', err?.stack || err);
    const details = process.env.NODE_ENV === 'production' ? undefined : String(err?.message || err);
    res.status(500).json({ error: 'Failed to increment counter', details });
  }
});

/**
 * POST /api/counter/reset
 * Reset the current user's counter to 0
 * Requires authentication
 */
router.post('/reset', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const counter = await cosmosService.resetUserCounter(req.user.userId);
    res.status(200).json(counter);
  } catch (err: any) {
    console.error('Error resetting counter:', err?.stack || err);
    const details = process.env.NODE_ENV === 'production' ? undefined : String(err?.message || err);
    res.status(500).json({ error: 'Failed to reset counter', details });
  }
});

export default router;
