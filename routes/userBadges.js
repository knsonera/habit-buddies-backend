const express = require('express');
const pool = require('../db');
const router = express.Router();

// Get all user badges
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM UserBadge');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get user badge by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM UserBadge WHERE user_badge_id = $1', [id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new user badge
router.post('/', async (req, res) => {
    try {
        const { user_id, badge_id, earned_date } = req.body;
        const result = await pool.query(
            'INSERT INTO UserBadge (user_id, badge_id, earned_date) VALUES ($1, $2, $3) RETURNING *',
            [user_id, badge_id, earned_date]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a user badge
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id, badge_id, earned_date } = req.body;
        const result = await pool.query(
            'UPDATE UserBadge SET user_id = $1, badge_id = $2, earned_date = $3, updated_at = CURRENT_TIMESTAMP WHERE user_badge_id = $4 RETURNING *',
            [user_id, badge_id, earned_date, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a user badge
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM UserBadge WHERE user_badge_id = $1', [id]);
        res.json({ message: 'User badge deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
