const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const pool = require('../db'); 
const jwtSecret = process.env.SECRET_KEY; 

// WebSocket close codes for custom error handling
const CLOSE_CODES = {
    TOKEN_MISSING: 4001,
    TOKEN_INVALID: 4002,
    MESSAGE_FORMAT_INVALID: 4003,
};

// Define wss at the module level
let wss;

// Handle incoming messages from a client
const handleMessage = async (ws, message) => {
    let parsedMessage;
    try {
        const messageString = message.toString();  // Convert Buffer to String
        parsedMessage = JSON.parse(messageString);
    } catch (err) {
        console.error('Failed to parse message:', err);
        ws.send(JSON.stringify({ error: 'Invalid message format' }));
        return;
    }

    const { questId, user_id, message_text } = parsedMessage;

    // Check if all required fields are present
    if (!questId || !user_id || !message_text) {
        ws.send(JSON.stringify({ error: 'Missing required fields' }));
        return;
    }

    let user;
    try {
        // Fetch the user's details based on user_id
        const userResult = await pool.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
        user = userResult.rows[0];
        if (!user) {
            console.error(`User not found for user_id: ${user_id}`);
            throw new Error('User not found');
        }
    } catch (err) {
        console.error('Error fetching user details:', err);
        ws.send(JSON.stringify({ error: 'Failed to fetch user details' }));
        return;
    }

    // Prepare a message for broadcast
    const broadcastMessage = {
        questId,
        user_id,
        username: user.username,
        message_text,
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
    try {
        // Broadcast to all connected clients
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(broadcastMessage));
            }
        });
    } catch (err) {
        console.error('Error broadcasting message:', err);
    }
};

// Initialize a websocket server
const setupWebSocket = (server) => {
    wss = new WebSocket.Server({ server });

    wss.on('connection', (ws, req) => {
        // Extract the token from the WebSocket protocol headers
        const token = req.headers['sec-websocket-protocol'];
        if (!token) {
            ws.close(CLOSE_CODES.TOKEN_MISSING, 'Token missing');
            return;
        }

        let decoded;
        try {
            // Verify JWT token
            decoded = jwt.verify(token, jwtSecret);
            //console.log('Token valid, user authenticated:', decoded);
        } catch (err) {
            //console.error('Invalid token:', err);
            ws.close(CLOSE_CODES.TOKEN_INVALID, 'Invalid token');
            return;
        }
        // Close connection
        ws.on('close', () => {
            //console.log(`Client disconnected.`);
        });

        // Incoming message
        ws.on('message', message => handleMessage(ws, message));
        // Confirm connection to a client
        ws.send(`You are connected.`);
    });

    return wss;
};

module.exports = setupWebSocket;
