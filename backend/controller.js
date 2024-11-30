const Video = require('./model');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');  
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);  
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100000000 },  
}).single('video');  

exports.uploadVideo = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: 'Video upload failed', error: err.message });
    }

    const { title} = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title are required' });
    }

    try {
      
      const newVideo = new Video({
        title,
        videoUrl: req.file.path,  
      });

      await newVideo.save();
      res.status(201).json({ message: 'Video uploaded successfully', video: newVideo });
    } catch (error) {
      res.status(500).json({ message: 'Error saving video', error: error.message });
    }
  });
};

exports.getVideos = async (req, res) => {
  try {
    const videos = await Video.find(); // Fetch all videos from the database
    res.status(200).json({ message: 'Videos retrieved successfully', videos });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving videos', error: error.message });
  }
};

exports.getVideoByTitle = async (req, res) => {
  const { title } = req.params; // Get title from the URL parameter

  try {
    const video = await Video.findOne({ title: title }); // Find video by title

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    res.status(200).json({ message: 'Video retrieved successfully', video });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving video', error: error.message });
  }
};