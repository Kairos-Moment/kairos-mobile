// backend/src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const JWT_SECRET = process.env.SESSION_SECRET || 'fallback_secret';

// A middleware to check if the user is authenticated (supports Session and JWT)
const ensureAuthenticated = async (req, res, next) => {
  // 1. Check Passport Session
  if (req.isAuthenticated()) {
    return next();
  }

  // 2. Check Authorization Header (Token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);

      // Look up user in DB to re-populate req.user
      const results = await pool.query("SELECT * FROM users WHERE id = $1", [decoded.id]);
      const user = results.rows[0];

      if (user) {
        req.user = user;
        // Also manually set req.isAuthenticated to true for compatibility
        req._passport_authenticated = true;
        return next();
      }
    } catch (error) {
      console.error("[AUTH] Token verification failed:", error.message);
    }
  }

  // If not authenticated, send an unauthorized status
  res.status(401).json({ message: 'You are not authorized to view this resource.' });
};

module.exports = { ensureAuthenticated };