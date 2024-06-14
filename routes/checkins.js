const express = require('express');
const pool = require('../db');
const router = express.Router();

// Get all checkins
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Checkins');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get checkin by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM Checkins WHERE checkin_id = $1', [id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new checkin
router.post('/', async (req, res) => {
    try {
        const { user_challenge_id, checkin_date, notes } = req.body;
        const result = await pool.query(
            'INSERT INTO Checkins (user_challenge_id, checkin_date, notes) VALUES ($1, $2, $3) RETURNING *',
            [user_challenge_id, checkin_date, notes]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a checkin
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { user_challenge_id, checkin_date, notes } = req.body;
        const result = await pool.query(
            'UPDATE Checkins SET user_challenge_id = $1, checkin_date = $2, notes = $3, updated_at = CURRENT_TIMESTAMP WHERE checkin_id = $4 RETURNING *',
            [user_challenge_id, checkin_date, notes, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a checkin
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM Checkins WHERE checkin_id = $1', [id]);
        res.json({ message: 'Checkin deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
