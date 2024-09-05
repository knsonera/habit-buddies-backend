const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get quests for news feed
router.get('/quests', authenticateToken, async (req, res) => {
    const { userId } = req.user;
    try {
        const result = await pool.query(`
            SELECT 
                u.user_id,
                u.fullname,
                q.quest_id,
                q.quest_name,
                uq.user_status AS action,
                uq.role,
                uq.joined_at AS action_time
            FROM UserQuests uq
            JOIN Users u ON uq.user_id = u.user_id
            JOIN Quests q ON uq.quest_id = q.quest_id
            WHERE uq.user_id IN (
                SELECT friend_id FROM Friendships WHERE user_id = $1 AND status = 'active'
                UNION
                SELECT user_id FROM Friendships WHERE friend_id = $1 AND status = 'active'
            )
            AND uq.user_status IN ('active', 'completed', 'dropped')
            AND uq.joined_at >= NOW() - INTERVAL '7 days'
            ORDER BY uq.joined_at DESC;
        `, [userId]);

        res.json(result.rows);

    } catch (err) {
        console.error('Error fetching quests feed:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get checkins for newsfeed
router.get('/checkins', authenticateToken, async (req, res) => {
    const { userId } = req.user;
    
    try {
        const result = await pool.query(`
            SELECT 
                c.checkin_id,
                c.created_at,
                u.user_id,
                u.fullname,
                q.quest_name
            FROM CheckIns c
            JOIN Users u ON c.user_id = u.user_id
            JOIN Quests q ON c.quest_id = q.quest_id
            WHERE c.user_id IN (
                SELECT friend_id FROM Friendships WHERE user_id = $1 AND status = 'active'
                UNION
                SELECT user_id FROM Friendships WHERE friend_id = $1 AND status = 'active'
            )
            AND c.created_at >= NOW() - INTERVAL '1 day'
            ORDER BY c.created_at DESC;
        `, [userId]);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching checkins feed:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;