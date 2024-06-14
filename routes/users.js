const express = require('express');
const pool = require('../db');
const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Users');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get user by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM Users WHERE user_id = $1', [id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get badges by user ID
router.get('/:id/badges', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(`
            SELECT Badges.*
            FROM Badges
            JOIN UserBadge ON Badges.badge_id = UserBadge.badge_id
            WHERE UserBadge.user_id = $1
        `, [userId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get friends by user ID
router.get('/:id/friends', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(`
            SELECT Users.*
            FROM Users
            JOIN Friendship ON Users.user_id = Friendship.friend_id
            WHERE Friendship.user_id = $1 AND Friendship.status = 'accepted'
        `, [userId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get check-ins by user ID
router.get('/:id/checkins', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(`
            SELECT Checkins.*
            FROM Checkins
            JOIN UserChallenge ON Checkins.user_challenge_id = UserChallenge.user_challenge_id
            WHERE UserChallenge.user_id = $1
        `, [userId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Get user challenges by user ID
router.get('/:id/challenges', async (req, res) => {
    try {
        const { userId } = req.params;
        const result = await pool.query(`
            SELECT Challenges.*
            FROM Challenges
            JOIN UserChallenge ON Challenges.challenge_id = UserChallenge.challenge_id
            WHERE UserChallenge.user_id = $1
        `, [userId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new user
router.post('/', async (req, res) => {
    try {
        const { username, email, password_hash, game_score, avatar_image } = req.body;
        const result = await pool.query(
            'INSERT INTO Users (username, email, password_hash, game_score, avatar_image) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [username, email, password_hash, game_score, avatar_image]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a user
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { username, email, password_hash, game_score, avatar_image } = req.body;
        const result = await pool.query(
            'UPDATE Users SET username = $1, email = $2, password_hash = $3, game_score = $4, avatar_image = $5, updated_at = CURRENT_TIMESTAMP WHERE user_id = $6 RETURNING *',
            [username, email, password_hash, game_score, avatar_image, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a user
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM Users WHERE user_id = $1', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
