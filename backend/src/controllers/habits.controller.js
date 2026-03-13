// backend/src/controllers/habits.controller.js

const { pool } = require("../config/database.js");

/**
 * Creates a new habit for the currently logged-in user.
 */
const createHabit = async (req, res) => {
  try {
    // SECURITY: Get the user ID from the authenticated session.
    const userId = req.user.id;

    // Get habit details from the request body.
    const { title, description, frequency, is_active, target_count } = req.body;

    // The 'created_at' column is handled by the database default.
    const query = `
      INSERT INTO habits (user_id, title, description, frequency, is_active, target_count)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *; -- Return the newly created habit
    `;

    const results = await pool.query(query, [
      userId, // Use the secure user ID from the session
      title,
      description,
      frequency,
      is_active,
      target_count || 1,
    ]);

    res.status(201).json(results.rows[0]);
    console.log(`New habit created for user ${userId}`);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("Error creating habit:", error.message);
  }
};

/**
 * Fetches a single habit by its ID, ensuring it belongs to the logged-in user.
 */
const getHabitById = async (req, res) => {
  try {
    const userId = req.user.id;
    const habitId = parseInt(req.params.id);

    // BUG FIX: Removed "asks" typo from the original query.
    // SECURITY: The query now checks BOTH the habit ID and the user ID.
    const query = `SELECT * FROM habits WHERE id = $1 AND user_id = $2`;
    const results = await pool.query(query, [habitId, userId]);

    if (results.rows.length === 0) {
      return res.status(404).json({ message: "Habit not found." });
    }

    res.status(200).json(results.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("Error getting habit by ID:", error.message);
  }
};

/**
 * Fetches all habits for the currently logged-in user.
 */
const getHabitsByUserId = async (req, res) => {
  try {
    // SECURITY: Get user ID from the session, not the request body.
    const userId = req.user.id;

    const query = `SELECT * FROM habits WHERE user_id = $1 ORDER BY id ASC`;
    const results = await pool.query(query, [userId]);

    res.status(200).json(results.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("Error getting habits by user ID:", error.message);
  }
};

/**
 * Updates an existing habit, ensuring it belongs to the logged-in user.
 */
const updateHabit = async (req, res) => {
  try {
    const userId = req.user.id;
    const habitId = parseInt(req.params.id);
    const { title, description, frequency, is_active, target_count } = req.body;

    // BUG FIX: The original query was updating the 'tasks' table instead of 'habits'.
    // SECURITY: The WHERE clause checks both habit ID and user ID before updating.
    const query = `
      UPDATE habits 
      SET title = $1, description = $2, frequency = $3, is_active = $4, target_count = $5
      WHERE id = $6 AND user_id = $7
      RETURNING *; -- Return the updated habit
    `;
    const results = await pool.query(query, [
      title,
      description,
      frequency,
      is_active,
      target_count || 1,
      habitId,
      userId,
    ]);

    if (results.rows.length === 0) {
      return res.status(404).json({ message: "Habit not found or you do not have permission to edit it." });
    }

    res.status(200).json(results.rows[0]);
    console.log(`Habit ${habitId} updated for user ${userId}`);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("Error updating habit:", error.message);
  }
};

/**
 * Deletes a habit, ensuring it belongs to the logged-in user.
 */
const deleteHabit = async (req, res) => {
  try {
    const userId = req.user.id;
    const habitId = parseInt(req.params.id);

    // SECURITY: The WHERE clause checks both habit ID and user ID before deleting.
    const query = `DELETE FROM habits WHERE id = $1 AND user_id = $2`;
    const results = await pool.query(query, [habitId, userId]);

    if (results.rowCount === 0) {
      // If no rows were deleted, the habit didn't exist or didn't belong to the user.
      return res.status(404).json({ message: "Habit not found or you do not have permission to delete it." });
    }

    // BUG FIX: The original function did not send a response on success.
    res.status(200).json({ message: `Habit with ID ${habitId} deleted successfully.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("Error deleting habit:", error.message);
  }
};

module.exports = {
  createHabit,
  getHabitById,
  getHabitsByUserId,
  updateHabit,
  deleteHabit,
};