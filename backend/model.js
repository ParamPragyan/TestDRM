const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  videoUrl: { type: String, required: true }, 
  createdAt: { type: Date, default: Date.now },
  isVideoUploaded: { type: Boolean, default: false },
  
});

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;
