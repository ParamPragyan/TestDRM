const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  videoUrl: { type: String, required: true },
  iv: { type: String, required: true }, // Store AES IV
  dashMpdUrl: { type: String, required: true },
  isVideoUploaded: { type: Boolean, default: false },
});

module.exports = mongoose.model('Video', videoSchema);
