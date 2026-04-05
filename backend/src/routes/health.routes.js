// backend/src/routes/health.routes.js
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

router.get('/', async (req, res) => {
    try {
        const start = Date.now();
        const result = await pool.query('SELECT NOW()');
        const duration = Date.now() - start;

        res.status(200).json({
            status: 'UP',
            database: 'CONNECTED',
            timestamp: result.rows[0].now,
            latency: `${duration}ms`,
            env: process.env.NODE_ENV
        });
    } catch (err) {
        console.error('Health Check - Database Error:', err);
        res.status(500).json({
            status: 'DOWN',
            database: 'ERROR',
            message: err.message,
            code: err.code
        });
    }
});

module.exports = router;
