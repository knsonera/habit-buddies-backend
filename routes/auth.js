const express = require('express');
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authenticateToken, generateTokens } = require('../middleware/auth');
const router = express.Router();

require('dotenv').config();
const jwtSecret = process.env.SECRET_KEY;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

// Signup endpoint
router.post('/signup', async (req, res) => {
    const { email, password, username, fullname } = req.body;
    // Generate a random avatar_id between 1 and 10
    const avatarId = Math.floor(Math.random() * 20) + 1;

    try {
        const emailCheck = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
        const usernameCheck = await pool.query('SELECT * FROM Users WHERE username = $1', [username]);

        if (emailCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Email already in use' });
        }
        if (usernameCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Username already in use' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO Users (email, password_hash, username, fullname, refresh_token, avatar_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [email, hashedPassword, username, fullname, null, avatarId]
        );

        const user = result.rows[0];
        const { token, refreshToken } = generateTokens(user.user_id);
        await pool.query('UPDATE Users SET refresh_token = $1 WHERE user_id = $2', [refreshToken, user.user_id]);

        res.status(201).json({ token, refreshToken, userId: user.user_id });
    } catch (err) {
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// User login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const { token, refreshToken } = generateTokens(user.user_id);
        await pool.query('UPDATE Users SET refresh_token = $1 WHERE user_id = $2', [refreshToken, user.user_id]);

        res.json({ token, refreshToken, userId: user.user_id });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Refresh token
router.post('/refresh-token', async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token is required' });
    }

    try {
        const decoded = jwt.verify(refreshToken, refreshTokenSecret);
        const result = await pool.query('SELECT * FROM Users WHERE user_id = $1 AND refresh_token = $2', [decoded.userId, refreshToken]);
        const user = result.rows[0];

        if (!user) {
            return res.status(403).json({ error: 'Invalid refresh token' });
        }

        // Invalidate the old refresh token and issue a new one
        const { token, refreshToken: newRefreshToken } = generateTokens(user.user_id);
        await pool.query('UPDATE Users SET refresh_token = $1 WHERE user_id = $2', [newRefreshToken, user.user_id]);

        res.json({ token, refreshToken: newRefreshToken, userId: user.user_id });
    } catch (err) {
        console.error('Refresh token verification failed:', err.message);

        if (err.name === 'TokenExpiredError') {
            return res.status(403).json({ error: 'Refresh token expired.' });
        } else if (err.name === 'JsonWebTokenError') {
            return res.status(403).json({ error: 'Invalid refresh token.' });
        } else {
            return res.status(403).json({ error: 'Refresh token verification failed.' });
        }
    }
});


// Check token validity
router.post('/check-token', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, jwtSecret, (err) => {
        if (err) {
            return res.sendStatus(403);
        }
        res.sendStatus(200);
    });
});

// User logout
router.post('/logout', authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        await pool.query('UPDATE Users SET refresh_token = NULL WHERE user_id = $1', [userId]);
        res.json({ message: 'Logout successful' });
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
