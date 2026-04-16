const { pool } = require('../config/database');

const ensureAuthenticated = async (req, res, next) => {
    // Session-based auth (web)
    if (req.isAuthenticated && req.isAuthenticated()) {
        return next();
    }

    // Token-based auth (mobile)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        try {
            const result = await pool.query('SELECT * FROM users WHERE accesstoken = $1', [token]);
            if (result.rows.length > 0) {
                req.user = result.rows[0];
                return next();
            }
        } catch (err) {
            console.error('[AUTH MIDDLEWARE] Token lookup failed:', err.message);
        }
    }

    res.status(401).json({ message: 'You are not authorized to view this resource.' });
};

module.exports = { ensureAuthenticated };
