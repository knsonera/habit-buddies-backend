const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Search users by username, fullname, or email
router.get('/search', authenticateToken, async (req, res) => {
    const { query } = req.query; // Ensure you are getting the query from req.query

    if (!query) {
        return res.status(400).json({ error: 'Search query is required' });
    }

    try {
        const result = await pool.query(
            `SELECT user_id, fullname, email, username, avatar_id
             FROM Users
             WHERE LOWER(username) LIKE LOWER($1) 
             OR LOWER(fullname) LIKE LOWER($1) 
             OR LOWER(email) LIKE LOWER($1)`,
            [`%${query}%`] // Pass the search term correctly as a string
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No users found' });
        }
        res.json(result.rows);
    } catch (err) {
        console.error('Search users error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Fetch user details
router.get('/:id', authenticateToken, async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        const result = await pool.query('SELECT * FROM Users WHERE user_id = $1', [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Fetch user error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Change user info
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { email, avatar_id, username, fullname } = req.body; 

    try {
        const result = await pool.query(
            'UPDATE Users SET email = $1, avatar_id = $2, username = $3, fullname = $4, updated_at = CURRENT_TIMESTAMP WHERE user_id = $5 RETURNING *',
            [email, avatar_id, username, fullname, id]
        );

        if (result.rows.length === 0) {
            console.error('User not found for ID:', id);
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Update user error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Fetch user's quests
router.get('/:id/quests', authenticateToken, async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        const result = await pool.query(`
            SELECT uq.*, q.*
            FROM UserQuests uq
            JOIN Quests q ON uq.quest_id = q.quest_id
            WHERE uq.user_id = $1 AND q.status = 'active'
        `, [userId]);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching user quests:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Fetch past user's quests
router.get('/:id/quests/past', authenticateToken, async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        const result = await pool.query(`
            SELECT uq.*, q.*
            FROM UserQuests uq
            JOIN Quests q ON uq.quest_id = q.quest_id
            WHERE uq.user_id = $1 AND (q.status = 'dropped' OR q.status = 'completed')
        `, [userId]);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching user quests:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Fetch user's active friends
router.get('/:id/friends', authenticateToken, async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        const result = await pool.query(`
            SELECT u.user_id, u.fullname, u.username, u.avatar_id
            FROM Friendships f
            JOIN Users u ON (f.user_id = u.user_id OR f.friend_id = u.user_id)
            WHERE (f.user_id = $1 OR f.friend_id = $1) AND f.status = 'active' AND u.user_id <> $1
        `, [userId]);

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching user friends:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Fetch all check-ins done by user
router.get('/:id/checkins', authenticateToken, async (req, res) => {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        const result = await pool.query(
            `SELECT c.*, q.quest_name
             FROM CheckIns c
             JOIN Quests q ON c.quest_id = q.quest_id
             WHERE c.user_id = $1
             ORDER BY c.checkin_date DESC`,
            [userId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching user check-ins:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Fetch all check-ins done by user for today
router.get('/:id/checkins/today', authenticateToken, async (req, res) => {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    try {
        const result = await pool.query(
            `SELECT c.*, q.quest_name
             FROM CheckIns c
             JOIN Quests q ON c.quest_id = q.quest_id
             WHERE c.user_id = $1 AND c.checkin_date::date = CURRENT_DATE
             ORDER BY c.checkin_date DESC`,
            [userId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching user check-ins:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
