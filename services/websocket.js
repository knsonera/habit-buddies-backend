const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const pool = require('../db'); 
const jwtSecret = process.env.SECRET_KEY; 

const CLOSE_CODES = {
    TOKEN_MISSING: 4001,
    TOKEN_INVALID: 4002,
    MESSAGE_FORMAT_INVALID: 4003,
};

const handleMessage = async (ws, message) => {
    console.log('Received message:', message); 
    let parsedMessage;

    try {
        parsedMessage = JSON.parse(message);
    } catch (err) {
        console.error('Failed to parse message:', err);
        ws.send(JSON.stringify({ error: 'Invalid message format' }));
        return;
    }

    const { questId, user_id, message_text } = parsedMessage;

    if (!questId || !user_id || !message_text) {
        ws.send(JSON.stringify({ error: 'Missing required fields' }));
        return;
    }

    let user;
    try {
        // Fetch the user's details based on user_id
        const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [user_id]);
        user = userResult.rows[0];
        if (!user) {
            console.error(`User not found for user_id: ${parsedMessage.user_id}`);
            throw new Error('User not found');
        }
    } catch (err) {
        console.error('Error fetching user details:', err);
        ws.send(JSON.stringify({ error: 'Failed to fetch user details' }));
        return;
    }

    const broadcastMessage = {
        questId: parsedMessage.questId,
        user_id: parsedMessage.user_id,
        username: user.username,
        message_text: parsedMessage.message_text,
        sent_at: new Date().toISOString(),
    };

    // Store message in the database
    try {
        await pool.query(
            'INSERT INTO QuestMessages (quest_id, user_id, message_text) VALUES ($1, $2, $3)',
            [questId, user_id, message_text]
        );
        console.log('Message stored in the database');
    } catch (err) {
        console.error('Error storing message:', err);
        ws.send(JSON.stringify({ error: 'Failed to store message' }));
        return;
    }

    // Broadcast to all connected clients
    try {
        wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(broadcastMessage));
            }
        });
        console.log('Broadcast message sent to clients');
    } catch (err) {
        console.error('Error broadcasting message:', err);
    }
};

const setupWebSocket = (server) => {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws, req) => {
        const token = req.headers['sec-websocket-protocol'];
        if (!token) {
            ws.close(CLOSE_CODES.TOKEN_MISSING, 'Token missing');
            return;
        }
        console.log('Client connected');

        let decoded;
        try {
            decoded = jwt.verify(token, jwtSecret);
            console.log('Token valid, user authenticated:', decoded);
        } catch (err) {
            console.error('Invalid token:', err);
            ws.close(CLOSE_CODES.TOKEN_INVALID, 'Invalid token');
            return;
        }

        ws.on('close', () => {
            console.log('Client disconnected');
            // Handle any cleanup if necessary
        });

        ws.on('message', message => handleMessage(ws, message));

        ws.send('Welcome to the chat');
    });

    return wss;
};

module.exports = setupWebSocket;