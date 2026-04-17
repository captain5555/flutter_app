const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../config/database');
const { sendError } = require('../utils/helpers');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1] || req.query.token;

  if (!token) {
    return sendError(res, 'Authentication required', 401);
  }

  jwt.verify(token, config.jwtSecret, async (err, decoded) => {
    if (err) {
      return sendError(res, 'Invalid or expired token', 403);
    }

    try {
      // Support both userId (new) and id (V2 compatibility) in token
      const userId = decoded.userId || decoded.id;
      const user = await db.getUser(userId);
      if (!user) {
        return sendError(res, 'User not found', 404);
      }
      req.user = user;
      next();
    } catch (error) {
      sendError(res, 'Authentication error', 500);
    }
  });
}

function generateToken(userId) {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

function refreshToken(token) {
  try {
    const decoded = jwt.verify(token, config.jwtSecret, { ignoreExpiration: true });
    const now = Date.now() / 1000;

    // Allow refresh within 7 days of expiration
    if (decoded.exp && now - decoded.exp < 7 * 24 * 60 * 60) {
      return generateToken(decoded.userId);
    }
    return null;
  } catch (err) {
    return null;
  }
}

module.exports = {
  authenticateToken,
  generateToken,
  refreshToken
};
