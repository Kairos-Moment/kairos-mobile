// backend/src/routes/saved-tracks.routes.js
const express = require('express');
const router = express.Router();
const savedTracksController = require('../controllers/saved-tracks.controller');

// All routes here are protected by the main app's authentication middleware (checkAuthenticated)
// assuming it's applied globally or at the mounting point in server.js.

router.post('/', savedTracksController.createTrack);
router.get('/', savedTracksController.getTracks);
router.delete('/:id', savedTracksController.deleteTrack);

module.exports = router;
