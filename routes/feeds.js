const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get quests feed
router.get('/quests', authenticateToken, async (req, res) => {
    const { userId } = req.user;
    try {
        const result = await pool.query(`
            SELECT q.*, u.username FROM Quests q
            JOIN Users u ON q.user_id = u.user_id
            WHERE q.user_id IN (SELECT friend_id FROM Friendships WHERE user_id = $1 AND status = 'active')
            AND q.updated_at >= NOW() - INTERVAL '7 days'
            ORDER BY q.updated_at DESC;
        `, [userId]);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching quests feed:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get check-ins feed
router.get('/checkins', authenticateToken, async (req, res) => {
    const { userId } = req.user;
    
    try {
        const result = await pool.query(`
            SELECT c.*, u.username FROM CheckIns c
            JOIN Users u ON c.user_id = u.user_id
            WHERE c.user_id IN (SELECT friend_id FROM Friendships WHERE user_id = $1 AND status = 'active')
            AND c.created_at >= NOW() - INTERVAL '7 days'
            ORDER BY c.created_at DESC;
        `, [userId]);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching checkins feed:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;