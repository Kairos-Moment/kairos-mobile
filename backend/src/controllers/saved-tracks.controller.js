// backend/src/controllers/saved-tracks.controller.js
const { pool } = require("../config/database.js");

/**
 * Saves a new track to the user's library.
 */
const createTrack = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, youtube_id } = req.body;

        if (!title || !youtube_id) {
            return res.status(400).json({ message: "Title and YouTube ID are required." });
        }

        const query = `
      INSERT INTO saved_tracks (user_id, title, youtube_id)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
        const results = await pool.query(query, [userId, title, youtube_id]);

        res.status(201).json(results.rows[0]);
    } catch (error) {
        console.error("Error saving track:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Fetches all saved tracks for the current user.
 */
const getTracks = async (req, res) => {
    try {
        const userId = req.user.id;
        const query = `SELECT * FROM saved_tracks WHERE user_id = $1 ORDER BY created_at DESC`;
        const results = await pool.query(query, [userId]);
        res.status(200).json(results.rows);
    } catch (error) {
        console.error("Error fetching tracks:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * Deletes a track from the library.
 */
const deleteTrack = async (req, res) => {
    try {
        const userId = req.user.id;
        const trackId = parseInt(req.params.id);

        const query = `DELETE FROM saved_tracks WHERE id = $1 AND user_id = $2`;
        const results = await pool.query(query, [trackId, userId]);

        if (results.rowCount === 0) {
            return res.status(404).json({ message: "Track not found or permission denied." });
        }

        res.status(200).json({ message: "Track deleted." });
    } catch (error) {
        console.error("Error deleting track:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    createTrack,
    getTracks,
    deleteTrack
};
