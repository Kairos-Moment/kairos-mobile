// backend/src/routes/focus-sessions.routes.js

const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth.middleware');

// Import all the controller functions we need
const { 
  createFocusSession,
  getFocusSessionsByUserId,
  updateFocusSession,
  deleteFocusSession 
} = require('../controllers/focus-sessions.controller');

// Apply the security middleware to ALL routes defined in this file.
// This ensures that only logged-in users can access these endpoints.
router.use(ensureAuthenticated);

/**
 * @route   POST /api/focus-sessions
 * @desc    Create a new focus session for the logged-in user.
 * @access  Private
 */
router.post('/', createFocusSession);

/**
 * @route   GET /api/focus-sessions
 * @desc    Get all focus sessions for the logged-in user.
 * @access  Private
 */
router.get('/', getFocusSessionsByUserId);

/**
 * @route   PATCH /api/focus-sessions/:id
 * @desc    Update the notes on a specific focus session.
 * @access  Private
 */
router.patch('/:id', updateFocusSession);

/**
 * @route   DELETE /api/focus-sessions/:id
 * @desc    Delete a specific focus session.
 * @access  Private
 */
router.delete('/:id', deleteFocusSession);

module.exports = router;