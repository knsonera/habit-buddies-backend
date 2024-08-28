const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const pool = require('../db'); // Adjust the path to your db configuration
const jwtSecret = process.env.SECRET_KEY; // Make sure your SECRET_KEY is set in your environment variables

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

    // Fetch the user's details based on user_id
    const userResult = await pool.query('SELECT full_name FROM users WHERE id = $1', [parsedMessage.user_id]);
    const user = userResult.rows[0];

    const broadcastMessage = {
        questId: parsedMessage.questId,
        user_id: parsedMessage.user_id,
        full_name: user.full_name, // Include user's full name
        message_text: parsedMessage.message_text,
        sent_at: new Date().toISOString(),
    };

    // Store message in the database
    try {
        await pool.query(
            'INSERT INTO QuestMessages (quest_id, user_id, message_text) VALUES ($1, $2, $3)',
            [questId, user_id, message_text]
        );
    } catch (err) {
        console.error('Error storing message:', err);
        ws.send(JSON.stringify({ error: 'Failed to store message' }));
        return;
    }

    // Broadcast to all connected clients
    wss.clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(broadcastMessage);
        }
    });
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

        // Verify the token
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
