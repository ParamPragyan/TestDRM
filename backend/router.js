const express = require('express');
const videoController = require('./controller');

const router = express.Router();

router.post('/upload', videoController.uploadVideo); // Upload video and generate license token
router.get('/videos', videoController.getVideos); // Get all videos
router.get('/videos/:title', videoController.getVideoByTitle); // Get video by title

module.exports = router;
