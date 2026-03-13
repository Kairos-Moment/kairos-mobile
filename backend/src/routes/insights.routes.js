// backend/src/routes/insights.routes.js

const express = require('express');
const router = express.Router();

// --- FIX IS HERE: Import BOTH functions ---
const { getOracleInsight, getWeeklyReport } = require('../controllers/insights.controller');
const { ensureAuthenticated } = require('../middleware/auth.middleware');

router.use(ensureAuthenticated);

// Dashboard Widget
router.get('/', getOracleInsight);

// Weekly Report Page
router.get('/weekly', getWeeklyReport);

module.exports = router;