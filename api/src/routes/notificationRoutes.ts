import express from 'express';
import { cosmosService } from '../services/cosmosService';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

/**
 * GET /api/notifications
 * Get user's notifications
 * Query params: unreadOnly=true (optional)
 * Requires authentication
 */
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = String(req.user.userId);
    const unreadOnly = req.query.unreadOnly === 'true';

    const notifications = await cosmosService.getNotifications(userId, unreadOnly);
    res.status(200).json(notifications);
  } catch (err: any) {
    console.error('Error fetching notifications:', err?.stack || err);
    const details = process.env.NODE_ENV === 'production' ? undefined : String(err?.message || err);
    res.status(500).json({ error: 'Failed to retrieve notifications', details });
  }
});

/**
 * POST /api/notifications/:id/read
 * Mark a notification as read
 * Requires authentication
 */
router.post('/:id/read', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;
    const userId = String(req.user.userId);

    const notification = await cosmosService.markNotificationAsRead(id, userId);
    res.status(200).json(notification);
  } catch (err: any) {
    console.error('Error marking notification as read:', err?.stack || err);
    
    if (err.message === 'Notification not found') {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const details = process.env.NODE_ENV === 'production' ? undefined : String(err?.message || err);
    res.status(500).json({ error: 'Failed to mark notification as read', details });
  }
});

/**
 * POST /api/notifications
 * Create a notification (system/admin use)
 * Body: { userId, type, title, message, expiresAt?, metadata? }
 * Requires authentication (TODO: add admin check)
 */
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // TODO: Add admin role check here if needed
    // For now, any authenticated user can create notifications (useful for testing)

    const { userId, type, title, message, expiresAt, metadata } = req.body;

    // Validation
    if (!userId || !type || !title || !message) {
      return res.status(400).json({ error: 'userId, type, title, and message are required' });
    }

    if (!['info', 'success', 'warning', 'error'].includes(type)) {
      return res.status(400).json({ error: 'type must be one of: info, success, warning, error' });
    }

    const notification = await cosmosService.createNotification({
      userId,
      type,
      title,
      message,
      read: false,
      expiresAt,
      metadata: metadata || {}
    });

    res.status(201).json(notification);
  } catch (err: any) {
    console.error('Error creating notification:', err?.stack || err);
    const details = process.env.NODE_ENV === 'production' ? undefined : String(err?.message || err);
    res.status(500).json({ error: 'Failed to create notification', details });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 * Requires authentication
 */
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;
    const userId = String(req.user.userId);

    await cosmosService.deleteNotification(id, userId);
    res.status(204).send();
  } catch (err: any) {
    console.error('Error deleting notification:', err?.stack || err);
    
    if (err.message === 'Notification not found' || err.code === 404) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const details = process.env.NODE_ENV === 'production' ? undefined : String(err?.message || err);
    res.status(500).json({ error: 'Failed to delete notification', details });
  }
});

export default router;
