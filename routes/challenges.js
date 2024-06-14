const express = require('express');
const pool = require('../db');
const router = express.Router();

// Get all challenges
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Challenges');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get challenge by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM Challenges WHERE challenge_id = $1', [id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new challenge
router.post('/', async (req, res) => {
    try {
        const { challenge_name, description, duration, checkin_frequency, time, icon_id, start_date, end_date } = req.body;
        const result = await pool.query(
            'INSERT INTO Challenges (challenge_name, description, duration, checkin_frequency, time, icon_id, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [challenge_name, description, duration, checkin_frequency, time, icon_id, start_date, end_date]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a challenge
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { challenge_name, description, duration, checkin_frequency, time, icon_id, start_date, end_date } = req.body;
        const result = await pool.query(
            'UPDATE Challenges SET challenge_name = $1, description = $2, duration = $3, checkin_frequency = $4, time = $5, icon_id = $6, start_date = $7, end_date = $8, updated_at = CURRENT_TIMESTAMP WHERE challenge_id = $9 RETURNING *',
            [challenge_name, description, duration, checkin_frequency, time, icon_id, start_date, end_date, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a challenge
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM Challenges WHERE challenge_id = $1', [id]);
        res.json({ message: 'Challenge deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
