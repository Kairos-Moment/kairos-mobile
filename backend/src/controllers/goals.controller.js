// backend/src/controllers/goals.controller.js

const { pool } = require("../config/database.js");

/**
 * Creates a new goal for the currently logged-in user.
 */
const createGoal = async (req, res) => {
  try {
    // SECURITY: Get the user ID from the authenticated session, NOT the request body.
    const userId = req.user.id;
    
    // Get goal details from the request body.
    const { title, description, status, target_date } = req.body;

    // The 'created_at' column is handled by the database default.
    const query = `
      INSERT INTO goals (user_id, title, description, status, target_date)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *; -- Return the newly created goal
    `;

    const results = await pool.query(query, [
      userId, // Use the secure user ID from the session
      title,
      description,
      status,
      target_date,
    ]);

    res.status(201).json(results.rows[0]);
    console.log(`New goal created for user ${userId}`);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("Error creating goal:", error.message);
  }
};

/**
 * Fetches a single goal by its ID, ensuring it belongs to the logged-in user.
 */
const getGoalById = async (req, res) => {
  try {
    const userId = req.user.id;
    const goalId = parseInt(req.params.id);

    // SECURITY: The query now checks BOTH the goal ID and the user ID.
    const query = `SELECT * FROM goals WHERE id = $1 AND user_id = $2`;
    const results = await pool.query(query, [goalId, userId]);

    if (results.rows.length === 0) {
      return res.status(404).json({ message: "Goal not found." });
    }

    res.status(200).json(results.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("Error getting goal by ID:", error.message);
  }
};

/**
 * Fetches all goals for the currently logged-in user.
 */
const getGoalsByUserId = async (req, res) => {
  try {
    // SECURITY: Get user ID from the session, not the request body.
    const userId = req.user.id;

    const query = `SELECT * FROM goals WHERE user_id = $1 ORDER BY target_date ASC`;
    const results = await pool.query(query, [userId]);

    res.status(200).json(results.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("Error getting goals by user ID:", error.message);
  }
};

/**
 * Updates an existing goal, ensuring it belongs to the logged-in user.
 */
const updateGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const goalId = parseInt(req.params.id);
    const { title, description, status, target_date } = req.body;

    // BUG FIX: The original query had incorrect parameter indices.
    // SECURITY: The WHERE clause checks both goal ID and user ID before updating.
    const query = `
      UPDATE goals 
      SET title = $1, description = $2, status = $3, target_date = $4 
      WHERE id = $5 AND user_id = $6
      RETURNING *; -- Return the updated goal
    `;
    const results = await pool.query(query, [
      title,
      description,
      status,
      target_date,
      goalId,
      userId,
    ]);

    if (results.rows.length === 0) {
      return res.status(404).json({ message: "Goal not found or you do not have permission to edit it." });
    }

    res.status(200).json(results.rows[0]);
    console.log(`Goal ${goalId} updated for user ${userId}`);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("Error updating goal:", error.message);
  }
};

/**
 * Deletes a goal, ensuring it belongs to the logged-in user.
 */
const deleteGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const goalId = parseInt(req.params.id);

    // SECURITY: The WHERE clause checks both goal ID and user ID before deleting.
    const query = `DELETE FROM goals WHERE id = $1 AND user_id = $2`;
    const results = await pool.query(query, [goalId, userId]);

    if (results.rowCount === 0) {
      // If no rows were deleted, the goal didn't exist or didn't belong to the user.
      return res.status(404).json({ message: "Goal not found or you do not have permission to delete it." });
    }

    res.status(200).json({ message: `Goal with ID ${goalId} deleted successfully.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log("Error deleting goal:", error.message);
  }
};

module.exports = {
  createGoal,
  getGoalById,
  getGoalsByUserId,
  updateGoal,
  deleteGoal,
};