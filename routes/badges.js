const express = require('express');
const pool = require('../db');
const router = express.Router();

// Get all badges
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Badges');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get badge by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM Badges WHERE badge_id = $1', [id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new badge
router.post('/', async (req, res) => {
    try {
        const { badge_name, description, image_path } = req.body;
        const result = await pool.query(
            'INSERT INTO Badges (badge_name, description, image_path) VALUES ($1, $2, $3) RETURNING *',
            [badge_name, description, image_path]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a badge
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { badge_name, description, image_path } = req.body;
        const result = await pool.query(
            'UPDATE Badges SET badge_name = $1, description = $2, image_path = $3, updated_at = CURRENT_TIMESTAMP WHERE badge_id = $4 RETURNING *',
            [badge_name, description, image_path, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a badge
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM Badges WHERE badge_id = $1', [id]);
        res.json({ message: 'Badge deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
