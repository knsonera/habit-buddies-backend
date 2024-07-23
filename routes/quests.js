const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Get all quests
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                q.*
            FROM Quests q
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching quests:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get quest by ID
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM Quests WHERE quest_id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Quest not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching quest:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new quest
router.post('/', authenticateToken, async (req, res) => {
    const { quest_name, description, duration, checkin_frequency, time, icon_id, start_date, end_date, category_id, status } = req.body;
    const userId = req.user.userId; // Assume userId is set by authenticateToken middleware
    try {
        await pool.query('BEGIN');

        const questResult = await pool.query(
            'INSERT INTO Quests (quest_name, description, duration, checkin_frequency, time, icon_id, start_date, end_date, category_id, created_by, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
            [quest_name, description, duration, checkin_frequency, time, icon_id, start_date, end_date, category_id, userId, status]
        );
        const quest = questResult.rows[0];

        await pool.query(
            "INSERT INTO UserQuests (user_id, quest_id, status, role) VALUES ($1, $2, 'active', 'owner')",
            [userId, quest.quest_id]
        );

        await pool.query('COMMIT');
        res.status(201).json(quest);
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error creating quest:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Join a quest
router.post('/:id/join', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    try {
        const result = await pool.query(
            "INSERT INTO UserQuests (user_id, quest_id, status) VALUES ($1, $2, 'active') RETURNING *",
            [userId, id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error joining quest:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Invite a friend to a quest
router.post('/:id/invite', authenticateToken, async (req, res) => {
    const { id } = req.params;  // quest ID
    const { senderId, receiverId } = req.body;  // IDs of the sender and receiver
    try {
        const result = await pool.query(
            'INSERT INTO FriendInvites (quest_id, sender_id, receiver_id) VALUES ($1, $2, $3) RETURNING *',
            [id, senderId, receiverId]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error inviting to quest:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update a quest
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { quest_name, description, duration, checkin_frequency, time, icon_id, start_date, end_date, category_id, status } = req.body;
    try {
        const result = await pool.query(
            'UPDATE Quests SET quest_name = $1, description = $2, duration = $3, checkin_frequency = $4, time = $5, icon_id = $6, start_date = $7, end_date = $8, category_id = $9, status = $10 WHERE quest_id = $11 RETURNING *',
            [quest_name, description, duration, checkin_frequency, time, icon_id, start_date, end_date, category_id, status, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Quest not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating quest:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a quest
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM Quests WHERE quest_id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Quest not found' });
        }
        res.json({ message: 'Quest deleted successfully' });
    } catch (err) {
        console.error('Error deleting quest:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start a quest (create a new UserQuest)
router.post('/:id/start', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    try {
        const result = await pool.query(
            "INSERT INTO UserQuests (user_id, quest_id, status, joined_at) VALUES ($1, $2, 'active', CURRENT_TIMESTAMP) RETURNING *",
            [userId, id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error starting quest:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
