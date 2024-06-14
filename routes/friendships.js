const express = require('express');
const pool = require('../db');
const router = express.Router();

// Get all friendships
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Friendship');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get friendship by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM Friendship WHERE friendship_id = $1', [id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new friendship
router.post('/', async (req, res) => {
    try {
        const { user_id, friend_id, status } = req.body;
        const result = await pool.query(
            'INSERT INTO Friendship (user_id, friend_id, status) VALUES ($1, $2, $3) RETURNING *',
            [user_id, friend_id, status]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a friendship
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id, friend_id, status } = req.body;
        const result = await pool.query(
            'UPDATE Friendship SET user_id = $1, friend_id = $2, status = $3, updated_at = CURRENT_TIMESTAMP WHERE friendship_id = $4 RETURNING *',
            [user_id, friend_id, status, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a friendship
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM Friendship WHERE friendship_id = $1', [id]);
        res.json({ message: 'Friendship deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
