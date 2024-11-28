const express = require('express');
const videoController = require('./controller');  

const router = express.Router();


router.post('/', videoController.uploadVideo);

module.exports = router;
