const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const Video = require('./model')
require('dotenv').config();


const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});


const storage = multerS3({
  s3: s3,
  bucket: process.env.AWS_S3_BUCKET_NAME,
  metadata: function (req, file, cb) {
    cb(null, { fieldName: file.fieldname });
  },
  key: function (req, file, cb) {
    cb(null, Date.now().toString() + '-' + file.originalname);  
  }
});

const upload = multer({ storage: storage }).single('video');  

exports.uploadVideo = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: 'Video upload failed', error: err.message });
    }

    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    try {
      
      const newVideo = new Video({
        title,
        videoUrl: req.file.location 
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
    const videos = await Video.find(); 
    res.status(200).json({ message: 'Videos retrieved successfully', videos });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving videos', error: error.message });
  }
};

// Fetch Video by Title
exports.getVideoByTitle = async (req, res) => {
  const { title } = req.params;

  try {
    const video = await Video.findOne({ title }); 
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    res.status(200).json({ message: 'Video retrieved successfully', video });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving video', error: error.message });
  }
};
