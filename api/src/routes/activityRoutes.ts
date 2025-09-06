import express from 'express';
import { cosmosService } from '../services/cosmosService';

const router = express.Router();

// GET /api/activities
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    const activities = await cosmosService.getActivities(userId as string);
    res.status(200).json(activities);
  } catch (err) {
    console.error('Error fetching activities:', err);
    res.status(500).json({ error: 'Failed to retrieve activities' });
  }
});

// GET /api/activities/stream
router.get('/stream', async (req, res) => {
  try {
    const activities = await cosmosService.getRecentActivities(20);
    res.status(200).json(activities);
  } catch (err) {
    console.error('Error fetching activity stream:', err);
    res.status(500).json({ error: 'Failed to retrieve activity stream' });
  }
});

// POST /api/activities
router.post('/', async (req, res) => {
  try {
    const { userId, type, data, metadata } = req.body;
    if (!userId || !type) {
      return res.status(400).json({ message: 'userId and type are required' });
    }
    
    const activity = await cosmosService.createActivity({
      userId,
      type,
      data: data || {},
      metadata: metadata || {}
    });
    
    res.status(201).json(activity);
  } catch (err) {
    console.error('Error creating activity:', err);
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

export default router;
