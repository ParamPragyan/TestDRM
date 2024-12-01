const express = require('express');
const videoController = require('./controller');  

const router = express.Router();

router.post('/', videoController.uploadVideo);

router.get('/videolist', videoController.getVideos);

router.get('/:title', videoController.getVideoByTitle);

module.exports = router;
