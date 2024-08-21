const WebSocket = require('ws');
const pool = require('../db'); // Adjust the path to your db configuration

const setupWebSocket = (server) => {
    const wss = new WebSocket.Server({ server });

    wss.on('connection', ws => {
        ws.on('message', async message => {
            console.log('Received message:', message); // Log received messages
            const parsedMessage = JSON.parse(message);
        
            // Store message in the database
            try {
                const { questId, user_id, message_text } = parsedMessage;
                await pool.query(
                    'INSERT INTO QuestMessages (quest_id, user_id, message_text) VALUES ($1, $2, $3)',
                    [questId, user_id, message_text]
                );
            } catch (err) {
                console.error('Error storing message:', err);
            }
        
            // Broadcast to all connected clients
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        });        

        ws.send('Welcome to the chat');
    });

    return wss;
};

module.exports = setupWebSocket;
