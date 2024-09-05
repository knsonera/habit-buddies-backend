const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Check friendship status
router.get('/status', authenticateToken, async (req, res) => {
    const { userId, friendId } = req.query;

    try {
        const result = await pool.query(`
            SELECT status FROM Friendships 
            WHERE (user_id = $1 AND friend_id = $2) 
            OR (user_id = $2 AND friend_id = $1)
        `, [userId, friendId]);

        if (result.rows.length === 0) {
            return res.json({ status: 'none' }); // No friendship found
        }

        res.json({ status: result.rows[0].status });
    } catch (err) {
        console.error('Error fetching friendship status:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Check friendship sender
router.get('/sender', authenticateToken, async (req, res) => {
    const { userId, friendId } = req.query;

    try {
        const result = await pool.query(`
            SELECT user_id FROM Friendships 
            WHERE (user_id = $1 AND friend_id = $2 AND status = 'pending')
            OR (user_id = $2 AND friend_id = $1 AND status = 'pending')
        `, [userId, friendId]);

        if (result.rows.length === 0) {
            return res.json({ sender: null }); // No pending friendship found
        }

        res.json({ senderId: result.rows[0].user_id });
    } catch (err) {
        console.error('Error fetching sender:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Request friendship
router.post('/request', authenticateToken, async (req, res) => {
    const { userId, friendId } = req.body;

    try {
        // Check if a friendship already exists in either order
        const existingFriendship = await pool.query(`
            SELECT * FROM Friendships 
            WHERE (user_id = $1 AND friend_id = $2) 
            OR (user_id = $2 AND friend_id = $1)
        `, [userId, friendId]);

        if (existingFriendship.rows.length > 0) {
            return res.status(400).json({ error: 'Friendship already exists or is pending' });
        }

        // Insert the new friendship with the original order
        const result = await pool.query(`
            INSERT INTO Friendships (user_id, friend_id, status) 
            VALUES ($1, $2, 'pending') RETURNING *
        `, [userId, friendId]);

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error sending friend request:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Approve friendship request
router.put('/approve', authenticateToken, async (req, res) => {
    const { userId, friendId } = req.body;

    try {
        const result = await pool.query(`
            UPDATE Friendships 
            SET status = 'active', updated_at = CURRENT_TIMESTAMP 
            WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'
            RETURNING *
        `, [friendId, userId]);  // Flip the order to ensure the request is from friendId to userId

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Friend request not found or already approved' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error approving friend request:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Remove friend
router.delete('/remove', authenticateToken, async (req, res) => {
    const { userId, friendId } = req.body;

    try {
        const result = await pool.query(`
            DELETE FROM Friendships 
            WHERE (user_id = $1 AND friend_id = $2)
            OR (user_id = $2 AND friend_id = $1) 
            RETURNING *
        `, [userId, friendId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Friendship not found' });
        }

        res.json({ message: 'Friendship removed successfully' });
    } catch (err) {
        console.error('Error removing friendship:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
