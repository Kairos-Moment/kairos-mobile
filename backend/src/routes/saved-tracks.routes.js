// backend/src/routes/saved-tracks.routes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const savedTracksController = require('../controllers/saved-tracks.controller');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: (req, file, cb) => {
        const unique = `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, unique);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('audio/')) return cb(null, true);
        cb(new Error('Only audio files are allowed.'));
    }
});

router.post('/', upload.single('audio'), savedTracksController.createTrack);
router.get('/', savedTracksController.getTracks);
router.delete('/:id', savedTracksController.deleteTrack);

module.exports = router;
