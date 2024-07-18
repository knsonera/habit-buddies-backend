const jwt = require('jsonwebtoken');
require('dotenv').config();

const jwtSecret = process.env.SECRET_KEY;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;

const generateTokens = (userId) => {
    const token = jwt.sign({ userId: parseInt(userId, 10) }, jwtSecret, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: parseInt(userId, 10) }, refreshTokenSecret, { expiresIn: '7d' });
    return { token, refreshToken };
};

const authenticateToken = (req, res, next) => {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const verified = jwt.verify(token, jwtSecret);
        req.user = verified;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid token.' });
    }
};

module.exports = {
    generateTokens,
    authenticateToken
};
