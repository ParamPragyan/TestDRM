const express = require('express');
const videoController = require('./controller');

const router = express.Router();

router.post('/upload', videoController.uploadVideo); // Upload video and generate license token
router.get('/videos', videoController.getVideos); // Get all videos
router.get('/videos/:id', videoController.getVideoById); // Get video by ID


module.exports = router;