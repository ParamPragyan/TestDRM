const express = require('express');
const videoController = require('./controller');  

const router = express.Router();

router.post('/', videoController.uploadVideo);

router.get('/getvideo', videoController.getVideos);

module.exports = router;
