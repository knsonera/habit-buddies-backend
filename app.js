const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const { authenticateToken } = require('./middleware/auth'); 
const setupWebSocket = require('./services/websocket'); // Adjust the path to your WebSocket setup

const app = express();

// Load secret key from environment variables
const jwtSecret = process.env.SECRET_KEY;

if (!jwtSecret) {
    console.error("SECRET_KEY is not defined in the environment variables.");
    process.exit(1);  // Exit the application with an error code
}

app.use(bodyParser.json());

// Import routes
const userRoutes = require('./routes/users'); 
const questsRoutes = require('./routes/quests');
const authRoutes = require('./routes/auth'); 

// Authentication routes (do not require authentication)
app.use('/auth', authRoutes);

// Apply authentication middleware to all routes that require authentication
app.use(authenticateToken);

// Use routes
app.use('/users', userRoutes);
app.use('/quests', questsRoutes);

const server = http.createServer(app);

// Setup WebSocket server
setupWebSocket(server);

if (require.main === module) {
    const port = process.env.PORT || 3000;
    server.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

module.exports = app;
