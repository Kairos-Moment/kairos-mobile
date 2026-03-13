// backend/src/routes/habit-logs.routes.js

const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth.middleware');

// Import all the controller functions we need
const {
  createHabitLog,
  getHabitLogsByHabitId,
  updateHabitLog,
  deleteHabitLog,
  deleteHabitLogByDate,
  deleteLatestHabitLog
} = require('../controllers/habit-logs.controller');

// Apply security middleware to all routes in this file
router.use(ensureAuthenticated);

/**
 * @route   POST /api/habit-logs
 * @desc    Create a new log for a habit.
 * @access  Private
 */
router.post('/', createHabitLog);

/**
 * @route   GET /api/habit-logs/habit/:habitId
 * @desc    Get all logs for a specific habit owned by the user.
 * @access  Private
 */
router.get('/habit/:habitId', getHabitLogsByHabitId);

/**
 * @route   PATCH /api/habit-logs/:id
 * @desc    Update the notes on a specific habit log.
 * @access  Private
 */
router.patch('/:id', updateHabitLog);

/**
 * @route   DELETE /api/habit-logs/:id
 * @desc    Delete a specific habit log.
 * @access  Private
 */
router.delete('/:id', deleteHabitLog);

/**
 * @route   DELETE /api/habit-logs/habit/:habitId/date/:date
 * @desc    Undo a habit log for a specific date.
 * @access  Private
 */
router.delete('/habit/:habitId/date/:date', deleteHabitLogByDate);
router.delete('/habit/:habitId/latest', deleteLatestHabitLog);

module.exports = router;