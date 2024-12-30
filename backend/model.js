const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const videoSchema = new mongoose.Schema({
  uuid: { type: String, default: uuidv4, unique: true }, 
  title: { type: String, required: true },
  videoUrl: { type: String, required: true }, 
  dashMpdUrl: { type: String, required: false }, 
  thumbnailUrl : { type: String, required: false },
  isVideoUploaded: { type: Boolean, default: false },
});

module.exports = mongoose.model('Video', videoSchema);