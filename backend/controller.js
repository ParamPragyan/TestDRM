const crypto = require('crypto');
const Video = require('./model');
const multer = require('multer');
const fs = require('fs');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { generatePallyconToken } = require('./pallyconToken');
const dotenv = require('dotenv');

dotenv.config();

// AES IV and Pallycon Site Info
const AES_IV = crypto.randomBytes(16);
const siteInfo = {
  siteId: process.env.PALLYCON_SITE_ID,
  siteKey: process.env.PALLYCON_SITE_KEY,
};

// AWS S3 Configuration
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100000000 }, // 100MB limit
}).single('video');

// Function to Encrypt a URL
function encryptUrl(url) {
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(siteInfo.siteKey, 'base64'),
    AES_IV
  );
  let encrypted = cipher.update(url, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return { encryptedUrl: encrypted, iv: AES_IV.toString('base64') };
}

// Function to Upload File to S3
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

  fs.unlinkSync(file.path); // Clean up locally uploaded file
  return fileName;
}

// Controller: Upload Video
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

      const videoUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
      const dashMpdUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/assets/${fileName}/DASH/${fileName.replace('.mp4', '')}.mpd`;

      const encryptedDashUrl = encryptUrl(dashMpdUrl).encryptedUrl;

      
      const newVideo = new Video({
        title,
        videoUrl, 
        dashMpdUrl, 
        dashMpdUrlEncrypted: encryptedDashUrl, 
        isVideoUploaded: true,
      });
      await newVideo.save();

    
      const licenseToken = generatePallyconToken(fileName);

      res.status(201).json({
        message: 'Video uploaded successfully',
        video: {
          title,
          videoUrl,
          isVideoUploaded: true,
        },
        licenseToken,
      });
    } catch (error) {
      res.status(500).json({ message: 'Error saving video', error: error.message });
    }
  });
};

exports.getVideoByTitle = async (req, res) => {
  const { title } = req.params;

  try {
    const video = await Video.findOne({ title });
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const licenseToken = generatePallyconToken(video.videoUrl);

    res.status(200).json({
      message: 'Video retrieved successfully',
      video: {
        title: video.title,
        // videoUrl: video.videoUrl,
        dashMpdUrl: video.dashMpdUrl,
        dashMpdUrlEncrypted: video.dashMpdUrlEncrypted,
        isVideoUploaded: video.isVideoUploaded,
      },
      licenseToken,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving video', error: error.message });
  }
};

// Controller: Get All Videos
exports.getVideos = async (req, res) => {
  try {
    const videos = await Video.find();

    const videosWithUrls = videos.map((video) => ({
      title: video.title,
      // videoUrl: video.videoUrl,
      dashMpdUrl: video.dashMpdUrl,
      dashMpdUrlEncrypted: video.dashMpdUrlEncrypted,
      isVideoUploaded: video.isVideoUploaded,
    }));

    res.status(200).json({
      message: 'Videos retrieved successfully',
      videos: videosWithUrls,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving videos', error: error.message });
  }
};