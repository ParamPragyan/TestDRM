const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  videoUrl: { type: String, required: true }, // Actual Video URL
  dashMpdUrl: { type: String, required: true }, // DASH URL
  dashMpdUrlEncrypted: { type: String, required: true }, // Encrypted DASH URL
  isVideoUploaded: { type: Boolean, default: false },
});

module.exports = mongoose.model('Video', videoSchema);