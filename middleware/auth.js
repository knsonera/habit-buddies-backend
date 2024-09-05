const jwt = require('jsonwebtoken');
require('dotenv').config();

// Load secret keys for JWT from environment variables
const jwtSecret = process.env.SECRET_KEY;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

// Generate access and refresh tokens for a user
const generateTokens = (userId) => {
    const token = jwt.sign({ userId: parseInt(userId, 10) }, jwtSecret, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: parseInt(userId, 10) }, refreshTokenSecret, { expiresIn: '7d' });
    return { token, refreshToken };
};

// Middleware to authenticate a JWT token from the request header
const authenticateToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    
    // If no token is provided or the format is incorrect, deny access
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Extract the actual token from the Authorization header
    const token = authHeader.split(' ')[1];

    try {
        // Verify the token using the secret key
        const verified = jwt.verify(token, jwtSecret);
        req.user = verified;
        next();
    } catch (err) {
        console.error('Token verification failed:', err.message);

        // Handle errors
        if (err.name === 'TokenExpiredError') {
            return res.status(403).json({ error: 'Token expired.' });
        } else if (err.name === 'JsonWebTokenError') {
            return res.status(403).json({ error: 'Invalid token.' });
        } else {
            return res.status(403).json({ error: 'Token verification failed.' });
        }
    }
};

module.exports = {
    generateTokens,
    authenticateToken
};
