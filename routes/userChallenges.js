const express = require('express');
const pool = require('../db');
const router = express.Router();

// Get all user challenges
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM UserChallenge');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get user challenge by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM UserChallenge WHERE user_challenge_id = $1', [id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new user challenge
router.post('/', async (req, res) => {
    try {
        const { user_id, challenge_id, status } = req.body;
        const result = await pool.query(
            'INSERT INTO UserChallenge (user_id, challenge_id, status) VALUES ($1, $2, $3) RETURNING *',
            [user_id, challenge_id, status]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a user challenge
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id, challenge_id, status } = req.body;
        const result = await pool.query(
            'UPDATE UserChallenge SET user_id = $1, challenge_id = $2, status = $3, updated_at = CURRENT_TIMESTAMP WHERE user_challenge_id = $4 RETURNING *',
            [user_id, challenge_id, status, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a user challenge
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM UserChallenge WHERE user_challenge_id = $1', [id]);
        res.json({ message: 'User challenge deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
