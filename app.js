require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const authenticateToken = require('./middleware/auth');
const app = express();

// Load secret key from environment variables
const secretKey = process.env.SECRET_KEY;

app.use(bodyParser.json());

// Import routes
const userRoutes = require('./routes/users');
const challengeRoutes = require('./routes/challenges');
const badgeRoutes = require('./routes/badges');
const userChallengeRoutes = require('./routes/userChallenges');
const checkinRoutes = require('./routes/checkins');
const friendshipRoutes = require('./routes/friendships');
const userBadgeRoutes = require('./routes/userBadges');
const authRoutes = require('./routes/auth');

// Authentication routes (do not require authentication)
app.use('/auth', authRoutes);

// Apply authentication middleware globally
app.use(authenticateToken);

// Use routes
app.use('/users', userRoutes);
app.use('/challenges', challengeRoutes);
app.use('/badges', badgeRoutes);
app.use('/user-challenges', userChallengeRoutes);
app.use('/checkins', checkinRoutes);
app.use('/friendships', friendshipRoutes);
app.use('/user-badges', userBadgeRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
