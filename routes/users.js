const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Fetch user details
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM Users WHERE user_id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Fetch user error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user details
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { email, avatar_id, username } = req.body;
    try {
        const result = await pool.query(
            'UPDATE Users SET email = $1, avatar_id = $2, username = $3, updated_at = CURRENT_TIMESTAMP WHERE user_id = $4 RETURNING *',
            [email, avatar_id, username, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Update user error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
