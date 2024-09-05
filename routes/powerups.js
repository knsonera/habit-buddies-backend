const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Send power-up to a user
router.post('/', authenticateToken, async (req, res) => {
    const { userId: sender_id } = req.user;
    const { receiver_id, event_type, event_id, message } = req.body;

    try {
        const result = await pool.query(
            `INSERT INTO PowerUps (sender_id, receiver_id, event_type, event_id, message) 
            VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [sender_id, receiver_id, event_type, event_id, message]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating power-up:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get unread power-ups for the current user
router.get('/unread', authenticateToken, async (req, res) => {
    const { userId } = req.user;

    try {
        const result = await pool.query(
            `SELECT 
                pu.power_up_id,
                pu.sender_id,
                pu.receiver_id,
                pu.event_type,
                pu.event_id,
                pu.message,
                pu.created_at,
                pu.is_read,
                u.fullname AS sender_fullname,
                CASE 
                    WHEN pu.event_type = 'UserQuest' THEN q.quest_name
                    WHEN pu.event_type = 'CheckIn' THEN cq.quest_name
                    ELSE NULL 
                END AS quest_name
            FROM PowerUps pu
            JOIN Users u ON pu.sender_id = u.user_id
            LEFT JOIN UserQuests uq ON pu.event_id = uq.user_quest_id AND pu.event_type = 'UserQuest'
            LEFT JOIN Quests q ON uq.quest_id = q.quest_id
            LEFT JOIN CheckIns ci ON pu.event_id = ci.checkin_id AND pu.event_type = 'CheckIn'
            LEFT JOIN Quests cq ON ci.quest_id = cq.quest_id
            WHERE pu.receiver_id = $1 AND pu.is_read = FALSE
            ORDER BY pu.created_at DESC`,
            [userId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching unread power-ups:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Mark power-up as read
router.put('/:id/read', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `UPDATE PowerUps SET is_read = TRUE WHERE power_up_id = $1 RETURNING *`,
            [id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error marking power-up as read:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;