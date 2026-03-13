// backend/src/controllers/focus-sessions.controller.js

const { pool } = require("../config/database.js");
const { differenceInMinutes } = require('date-fns'); // Ensure 'date-fns' is in backend/package.json

/**
 * Creates a new focus session for a task owned by the currently logged-in user.
 * It calculates the duration on the backend for reliability.
 */
const createFocusSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const { task_id, start_time, end_time, notes } = req.body;

    // Validate that required fields are present
    if (!task_id || !start_time || !end_time) {
      return res.status(400).json({ message: "task_id, start_time, and end_time are required." });
    }

    // SECURITY CHECK: Verify that the task being logged against belongs to the current user.
    const taskCheckQuery = `SELECT id FROM tasks WHERE id = $1 AND user_id = $2`;
    const taskCheckResult = await pool.query(taskCheckQuery, [task_id, userId]);

    if (taskCheckResult.rows.length === 0) {
      return res.status(403).json({ message: "Forbidden: You do not own the parent task." });
    }
    
    // SERVER-SIDE CALCULATION: Calculate duration reliably.
    const duration_minutes = differenceInMinutes(new Date(end_time), new Date(start_time));
    if (duration_minutes < 0) {
        return res.status(400).json({ message: "End time cannot be before start time." });
    }

    // Proceed to insert the session.
    const insertQuery = `
      INSERT INTO focus_sessions (user_id, task_id, start_time, end_time, duration_minutes, notes)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const results = await pool.query(insertQuery, [
      userId,
      task_id,
      start_time,
      end_time,
      duration_minutes,
      notes || '', // Default to an empty string if notes are not provided
    ]);

    res.status(201).json(results.rows[0]);
    console.log(`New focus session created for user ${userId} on task ${task_id}`);
  } catch (error) {
    console.error("Error creating focus session:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
};

/**
 * Fetches all focus sessions for the currently logged-in user.
 */
const getFocusSessionsByUserId = async (req, res) => {
  try {
    const userId = req.user.id;
    const query = `SELECT * FROM focus_sessions WHERE user_id = $1 ORDER BY start_time DESC`;
    const results = await pool.query(query, [userId]);
    res.status(200).json(results.rows);
  } catch (error) {
    console.error("Error getting focus sessions:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
};

/**
 * Updates the 'notes' of an existing focus session, ensuring it belongs to the logged-in user.
 */
const updateFocusSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = parseInt(req.params.id);
    const { notes } = req.body;

    // Validate that 'notes' is provided
    if (typeof notes === 'undefined') {
        return res.status(400).json({ message: "The 'notes' field is required for an update." });
    }

    // SECURITY: The WHERE clause checks both session ID and user ID before updating.
    const query = `
      UPDATE focus_sessions 
      SET notes = $1
      WHERE id = $2 AND user_id = $3
      RETURNING *;
    `;
    const results = await pool.query(query, [notes, sessionId, userId]);

    if (results.rows.length === 0) {
      return res.status(404).json({ message: "Focus session not found or you do not have permission to edit it." });
    }

    res.status(200).json(results.rows[0]);
    console.log(`Focus session ${sessionId} updated for user ${userId}`);
  } catch (error) {
    console.error("Error updating focus session:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
};

/**
 * Deletes a focus session, ensuring it belongs to the logged-in user.
 */
const deleteFocusSession = async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = parseInt(req.params.id);

    // SECURITY: The WHERE clause checks both session ID and user ID.
    const query = `DELETE FROM focus_sessions WHERE id = $1 AND user_id = $2`;
    const results = await pool.query(query, [sessionId, userId]);

    if (results.rowCount === 0) {
      return res.status(404).json({ message: "Focus session not found or you do not have permission to delete it." });
    }
    
    res.status(200).json({ message: `Focus session with ID ${sessionId} deleted successfully.` });
  } catch (error) {
    console.error("Error deleting focus session:", error);
    res.status(500).json({ error: "An internal server error occurred." });
  }
};

module.exports = {
  createFocusSession,
  getFocusSessionsByUserId,
  updateFocusSession,
  deleteFocusSession,
};