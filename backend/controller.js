const crypto = require('crypto');
const Video = require('./model');
const multer = require('multer');
const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { generatePallyconToken } = require('./pallyconToken');
const dotenv = require('dotenv');

dotenv.config();

// AES Initialization Vector (IV) - 16-byte IV (for AES-256-CBC)
const AES_IV = crypto.randomBytes(16);

// Pallycon Site Information
const siteInfo = {
  siteId: process.env.PALLYCON_SITE_ID,
  siteKey: process.env.PALLYCON_SITE_KEY,
};

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
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(siteInfo.siteKey, 'base64'), AES_IV);
  let encrypted = cipher.update(url, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return { encryptedUrl: encrypted, iv: AES_IV.toString('base64') }; // Return encrypted URL and IV
}

// Upload video to S3
async function uploadToS3(file) {
  const fileName = `${Date.now()}-${file.originalname}`;
  const fileBuffer = fs.readFileSync(file.path);

  const uploadParams = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentType: file.mimetype,
  };

  const command = new PutObjectCommand(uploadParams);
  await s3.send(command);

  fs.unlinkSync(file.path); // Remove file locally
  return fileName;
}

// Controller for uploading video
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
      const fileName = await uploadToS3(req.file);

      // Video URL and DASH MPD URL
      const videoUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
      const dashFileBaseName = fileName.replace('.mp4', '');
      const dashMpdUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/assets/${fileName}/DASH/${dashFileBaseName}.mpd`;

      // Encrypt URLs
      const { encryptedUrl: encryptedVideoUrl, iv } = encryptUrl(videoUrl);
      const { encryptedUrl: encryptedDashMpdUrl } = encryptUrl(dashMpdUrl);

      // Save to database
      const newVideo = new Video({
        title,
        videoUrl: encryptedVideoUrl,
        dashMpdUrl: encryptedDashMpdUrl,
        iv,
        isVideoUploaded: true,
      });
      await newVideo.save();

      const licenseToken = generatePallyconToken(fileName); // Pass fileName instead of videoKey

      res.status(201).json({
        message: 'Video uploaded successfully',
        video: {
          title,
          videoUrl: encryptedVideoUrl,
          dashMpdUrl: encryptedDashMpdUrl,
          iv,
          isVideoUploaded: true,
        },
        licenseToken,
      });
    } catch (error) {
      res.status(500).json({ message: 'Error saving video', error: error.message });
    }
  });
};

// Controller to get video by title
exports.getVideoByTitle = async (req, res) => {
  const { title } = req.params;

  try {
    const video = await Video.findOne({ title });
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const licenseToken = generatePallyconToken(video.videoUrl); // Use video URL

    res.status(200).json({
      message: 'Video retrieved successfully',
      video: {
        title: video.title,
        videoUrl: video.videoUrl,
        dashMpdUrl: video.dashMpdUrl,
        isVideoUploaded: video.isVideoUploaded,
      },
      licenseToken,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving video', error: error.message });
  }
};

// Controller to get all videos
exports.getVideos = async (req, res) => {
  try {
    const videos = await Video.find();

    const videosWithEncryptedUrls = videos.map((video) => {
      // Validate if dashMpdUrl exists
      let encryptedDashMpdUrl = null;
      if (video.dashMpdUrl) {
        const { encryptedUrl } = encryptUrl(video.dashMpdUrl); // Encrypt only if URL exists
        encryptedDashMpdUrl = encryptedUrl;
      }

      return {
        title: video.title,
        videoUrl: video.videoUrl, // Already encrypted in DB
        dashMpdUrl: encryptedDashMpdUrl, // Encrypted only if available
        iv: video.iv, // Initialization Vector
        isVideoUploaded: video.isVideoUploaded,
      };
    });

    res.status(200).json({
      message: 'Videos retrieved successfully',
      videos: videosWithEncryptedUrls,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving videos', error: error.message });
  }
};
