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
            "INSERT INTO UserQuests (user_id, quest_id, user_status, role) VALUES ($1, $2, 'active', 'owner')",
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

// Update a quest
router.put('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const {
        quest_name,
        description,
        duration,
        checkin_frequency,
        time,
        icon_id,
        start_date,
        end_date,
        category_id,
        status
    } = req.body;

    // Basic validation
    if (!quest_name || !description || !duration || !checkin_frequency || !time || !icon_id || !start_date || !end_date || !category_id || !status) {
        return res.status(400).json({ error: 'All fields are required' });
    }

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
            "INSERT INTO UserQuests (user_id, quest_id, user_status, joined_at) VALUES ($1, $2, 'active', CURRENT_TIMESTAMP) RETURNING *",
            [userId, id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error starting quest:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get category for a quest
router.get('/:id/category', authenticateToken, async (req, res) => {
    const { id } = req.params; // quest ID
    const { ownerId } = req.query; // owner ID from query params

    try {
        const query = `
            SELECT c.category_id, c.category_name
            FROM Quests q
            JOIN Categories c ON q.category_id = c.category_id
            WHERE q.quest_id = $1 AND q.created_by = $2;
        `;

        const result = await pool.query(query, [id, ownerId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Category not found for the provided quest and owner.' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get the owner of a quest
router.get('/:id/owner', authenticateToken, async (req, res) => {
    const { id } = req.params;  // quest ID

    try {
        const result = await pool.query(
            `SELECT u.user_id, u.username, u.fullname
            FROM Users u
            JOIN UserQuests uq ON u.user_id = uq.user_id
            WHERE uq.quest_id = $1 AND uq.role = $2`,
            [id, 'owner']
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Owner not found for this quest.' });
        }

        res.json(result.rows[0]);  // Assuming there is only one owner per quest
    } catch (err) {
        console.error('Error fetching quest owner:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Get users (participants) for the quest
router.get('/:id/users', authenticateToken, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `SELECT u.user_id, u.username, u.fullname, uq.role, uq.user_status
            FROM Users u
            JOIN UserQuests uq ON u.user_id = uq.user_id
            WHERE uq.quest_id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No participants found for this quest' });
        }

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching quest participants:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Request to join a quest
router.post('/:id/request', authenticateToken, async (req, res) => {
    const { id } = req.params;  // quest ID
    const userId = req.user.userId;

    try {
        // Check if the user is already part of the quest or has a pending request
        const existingRequest = await pool.query(
            'SELECT * FROM UserQuests WHERE quest_id = $1 AND user_id = $2',
            [id, userId]
        );

        if (existingRequest.rows.length > 0) {
            return res.status(400).json({ error: 'You have already joined or requested to join this quest.' });
        }

        // Insert a new pending request
        const result = await pool.query(
            'INSERT INTO UserQuests (user_id, quest_id, user_status, role) VALUES ($1, $2, $3, $4) RETURNING *',
            [userId, id, 'pending', 'participant']
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error requesting to join quest:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Approve a request to join a quest
router.post('/:id/request-approve', authenticateToken, async (req, res) => {
    const { id } = req.params;  // quest ID
    const { userId } = req.body;  // ID of the user who requested to join

    const ownerId = req.user.userId;

    try {
        const ownerCheck = await pool.query(
            'SELECT * FROM UserQuests WHERE quest_id = $1 AND user_id = $2 AND role = $3',
            [id, ownerId, 'owner']
        );

        if (ownerCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Only the owner can approve requests.' });
        }

        const request = await pool.query(
            'UPDATE UserQuests SET user_status = $1 WHERE quest_id = $2 AND user_id = $3 AND user_status = $4 RETURNING *',
            ['active', id, userId, 'pending']
        );

        if (request.rows.length === 0) {
            return res.status(404).json({ error: 'No pending request found.' });
        }

        res.status(200).json(request.rows[0]);
    } catch (err) {
        console.error('Error approving request:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a request to join a quest
router.delete('/:id/request-delete', authenticateToken, async (req, res) => {
    const { id } = req.params;  // quest ID
    const { userId } = req.body;  // ID of the user who requested to join

    const ownerId = req.user.userId;

    try {
        const ownerCheck = await pool.query(
            'SELECT * FROM UserQuests WHERE quest_id = $1 AND user_id = $2 AND role = $3',
            [id, ownerId, 'owner']
        );

        if (ownerCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Only the owner can delete requests.' });
        }

        const request = await pool.query(
            'DELETE FROM UserQuests WHERE quest_id = $1 AND user_id = $2 AND user_status = $3 RETURNING *',
            [id, userId, 'pending']
        );

        if (request.rows.length === 0) {
            return res.status(404).json({ error: 'No pending request found.' });
        }

        res.status(200).json({ message: 'Request deleted successfully' });
    } catch (err) {
        console.error('Error deleting request:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Invite a friend to a quest
router.post('/:id/invite', authenticateToken, async (req, res) => {
    const { id } = req.params;  // quest ID
    const { userId, inviterId } = req.body;  // ID of the user being invited

    console.log('Received invite request:', {
        questId: id,
        invitedUserId: userId,
        inviterId: inviterId
    });

    if (!id || !userId || !inviterId) {
        console.error('Missing required fields:', {
            questId: id,
            userId: userId,
            inviterId: inviterId
        });
        return res.status(400).json({ error: 'Missing required fields.' });
    }

    try {
        // Check if the inviter is the quest owner or participant
        const inviterCheck = await pool.query(
            'SELECT * FROM UserQuests WHERE quest_id = $1 AND user_id = $2 AND role IN ($3, $4)',
            [id, inviterId, 'owner', 'participant']
        );

        if (inviterCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Only quest owner or participants can invite others.' });
        }

        // Check if the user is already in the quest or has a pending invite
        const existingEntry = await pool.query(
            'SELECT * FROM UserQuests WHERE quest_id = $1 AND user_id = $2',
            [id, userId]
        );

        if (existingEntry.rows.length > 0) {
            return res.status(409).json({ error: 'User is already in the quest or has a pending invite.' });
        }

        // Insert a new entry into UserQuests with status "invited"
        const invite = await pool.query(
            'INSERT INTO UserQuests (user_id, quest_id, user_status, role) VALUES ($1, $2, $3, $4) RETURNING *',
            [userId, id, 'invited', 'participant']
        );

        res.status(201).json(invite.rows[0]);
    } catch (err) {
        console.error('Error inviting friend:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Accept an invite to a quest
router.post('/:id/invite-accept', authenticateToken, async (req, res) => {
    const { id } = req.params;  // quest ID
    const userId = req.user.userId;  // ID of the user accepting the invite

    try {
        const inviteCheck = await pool.query(
            'SELECT * FROM UserQuests WHERE quest_id = $1 AND user_id = $2 AND user_status = $3',
            [id, userId, 'invited']
        );

        if (inviteCheck.rows.length === 0) {
            return res.status(404).json({ error: 'No invite found for this user.' });
        }

        const acceptInvite = await pool.query(
            'UPDATE UserQuests SET user_status = $1 WHERE quest_id = $2 AND user_id = $3 RETURNING *',
            ['active', id, userId]
        );

        res.status(200).json(acceptInvite.rows[0]);
    } catch (err) {
        console.error('Error accepting invite:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Decline an invite to a quest
router.delete('/:id/invite-delete', authenticateToken, async (req, res) => {
    const { id } = req.params;  // quest ID
    const userId = req.user.userId;  // ID of the user declining the invite

    try {
        const inviteCheck = await pool.query(
            'SELECT * FROM UserQuests WHERE quest_id = $1 AND user_id = $2 AND user_status = $3',
            [id, userId, 'invited']
        );

        if (inviteCheck.rows.length === 0) {
            return res.status(404).json({ error: 'No invite found for this user.' });
        }

        await pool.query(
            'DELETE FROM UserQuests WHERE quest_id = $1 AND user_id = $2 AND user_status = $3',
            [id, userId, 'invited']
        );

        res.status(200).json({ message: 'Invite declined successfully' });
    } catch (err) {
        console.error('Error declining invite:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create new check-in
router.post('/:id/checkins', authenticateToken, async (req, res) => {
    const { id } = req.params; 
    const user_id = req.user.userId;
    const { comment } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO CheckIns (user_id, quest_id, checkin_date, comment) VALUES ($1, $2, CURRENT_DATE, $3) RETURNING *',
            [user_id, id, comment]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            res.status(409).json({ error: 'You have already checked in today for this quest.' });
        } else {
            console.error('Error creating check-in:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// Fetch all check-ins for the quest
router.get('/:id/checkins', authenticateToken, async (req, res) => {
    const { id } = req.params;  // quest_id from the URL

    try {
        const result = await pool.query(
            `
            SELECT c.checkin_id, c.user_id, c.quest_id, c.checkin_date, c.comment, c.created_at, u.fullname 
            FROM CheckIns c
            JOIN Users u ON c.user_id = u.user_id
            WHERE c.quest_id = $1
            ORDER BY c.created_at DESC
            `,
            [id]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching check-ins:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Fetch all check-ins done by a particular user
router.get('/:id/users/:user_id/checkins', authenticateToken, async (req, res) => {
    const { id, user_id } = req.params;

    try {
        const result = await pool.query(
            'SELECT * FROM CheckIns WHERE quest_id = $1 AND user_id = $2 ORDER BY checkin_date DESC',
            [id, user_id]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching check-ins:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Fetch check-ins done by a particular user for today
router.get('/:id/users/:user_id/checkins/today', authenticateToken, async (req, res) => {
    const { id, user_id } = req.params;

    try {
        const result = await pool.query(
            'SELECT * FROM CheckIns WHERE quest_id = $1 AND user_id = $2 AND checkin_date::date = CURRENT_DATE ORDER BY checkin_date DESC',
            [id, user_id]
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error('Error fetching check-ins:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Fetch messages for a quest
router.get('/:id/messages', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'SELECT m.message_id, m.user_id, u.username, m.message_text, m.sent_at FROM QuestMessages m JOIN Users u ON m.user_id = u.user_id WHERE m.quest_id = $1 ORDER BY m.sent_at ASC',
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching messages:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Store a new message
router.post('/:id/messages', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { message_text, user_id } = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO QuestMessages (quest_id, user_id, message_text) VALUES ($1, $2, $3) RETURNING *',
            [id, user_id, message_text]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error storing message:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
