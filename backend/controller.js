
const crypto = require('crypto');
const Video = require('./model');
const multer = require('multer');
const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { generatePallyconToken } = require('./pallyconToken');
const dotenv = require('dotenv');

dotenv.config();

// AWS S3 configuration
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100000000 }, // 100MB file size limit
}).single('video');

// Encrypt the video URL using AES-256-CBC
function encryptUrl(url) {
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(process.env.PALLYCON_SITE_KEY, 'base64'), Buffer.from('0123456789abcdef'));
  let encrypted = cipher.update(url, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return { encryptedUrl: encrypted, iv: '0123456789abcdef' }; // Return encrypted URL and IV
}

// Function to upload video to S3 with folder path
async function uploadToS3(file) {
  const videoKey = `videos/input/${Date.now()}-${file.originalname}`;
  const fileBuffer = fs.readFileSync(file.path);

  const uploadParams = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: videoKey,
    Body: fileBuffer,
    ContentType: file.mimetype,
  };

  const command = new PutObjectCommand(uploadParams);
  try {
    await s3.send(command);
  } catch (error) {
    throw new Error(`S3 Upload Failed: ${error.message}`);
  }

  fs.unlinkSync(file.path); // Remove local file after upload
  return videoKey;
}

// Video Upload Controller
exports.uploadVideo = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: 'Video upload failed', error: err.message });
    }

    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    try {
      const videoKey = await uploadToS3(req.file);

      const videoUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${videoKey}`;
      const { encryptedUrl, iv } = encryptUrl(videoUrl);

      const newVideo = new Video({
        title,
        videoUrl,
        iv,
        isVideoUploaded: true,
      });
      await newVideo.save();

      res.status(201).json({
        message: 'Video uploaded successfully',
        video: {
          title,
          videoUrl,
          iv,
          isVideoUploaded: true,
        },
      });
    } catch (error) {
      res.status(500).json({ message: 'Error saving video', error: error.message });
    }
  });
};

// Controller to Get Video by Title
exports.getVideoByTitle = async (req, res) => {
  const { title } = req.params;

  try {
    const video = await Video.findOne({ title });
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const licenseToken = generatePallyconToken();
    
    const videoKey = video.videoUrl.split('/').pop(); // Extract the file name from video URL

    // Ensure that videoKey has no query parameters or unnecessary path parts
    const cleanVideoKey = videoKey.split('?')[0]; // Remove any query parameters

    const dashMpdKey = `videos/output/${cleanVideoKey.replace('.mp4', '.mpd')}`; // Replace .mp4 with .mpd
    const dashMpdUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${dashMpdKey}`;

    res.status(200).json({
      message: 'Video retrieved successfully',
      video: {
        title: video.title,
        videoUrl: video.videoUrl,
        dashMpdUrl: dashMpdUrl, // Correct dashMpdUrl
        isVideoUploaded: video.isVideoUploaded,
        licenseToken,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving video', error: error.message });
  }
};


// Controller to Get All Videos
exports.getVideos = async (req, res) => {
  try {
    const videos = await Video.find();

    const videosWithTokens = videos.map((video) => {
      const videoKey = video.videoUrl.split('/').pop();
      // const licenseToken = generatePallyconToken();  // Use the pre-generated token for all videos

      const dashMpdKey = `videos/output/${videoKey.replace('.mp4', '.mpd')}`;
      const dashMpdUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${dashMpdKey}`;

      return {
        title: video.title,
        videoUrl: video.videoUrl,
        dashMpdUrl,
        iv: video.iv,
        isVideoUploaded: video.isVideoUploaded,
      };
    });

    res.status(200).json({
      message: 'Videos retrieved successfully',
      videos: videosWithTokens,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving videos', error: error.message });
  }
};