const crypto = require('crypto');
const Video = require('./model');
const multer = require('multer');
const fs = require('fs');
const { S3Client, PutObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { generatePallyconToken } = require('./pallyconToken');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid'); // Import UUID package

dotenv.config();

// AWS S3 configuration using AWS SDK v3
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

// Encrypt URL function
function encryptUrl(url) {
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(process.env.PALLYCON_SITE_KEY, 'base64'), Buffer.from('0123456789abcdef'));
  let encrypted = cipher.update(url, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return { encryptedUrl: encrypted, iv: '0123456789abcdef' };
}

// Upload video to S3
async function uploadToS3(file) {
  const videoUuid = uuidv4();
  const videoKey = `videos/input/${Date.now()}-${videoUuid}.mp4`;
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

// Poll S3 to check if MPD file exists
async function checkMpdExists(mpdKey) {
  try {
    const command = new HeadObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: mpdKey,
    });
    await s3.send(command);
    return true;
  } catch {
    return false;
  }
}

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
      // Step 1: Upload video to S3
      const videoKey = await uploadToS3(req.file);
      const videoUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${videoKey}`;

      // Step 2: Encrypt the video URL
      const { encryptedUrl, iv } = encryptUrl(videoUrl);

      // Step 3: Save metadata to MongoDB
      const newVideo = new Video({
        title,
        videoUrl,
        iv,
        isVideoUploaded: true,
      });
      await newVideo.save();

      // Step 4: Wait for Lambda to generate the MPD file
      const mpdKey = `videos/output/${videoKey.split('/').pop().replace('.mp4', '.mpd')}`;
      const mpdUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${mpdKey}`;

      let mpdExists = false;
      for (let i = 0; i < 10; i++) { // Retry up to 10 times
        mpdExists = await checkMpdExists(mpdKey);
        if (mpdExists) break;
        await new Promise((resolve) => setTimeout(resolve, 50000)); // Wait 50 seconds
      }

      if (!mpdExists) {
        throw new Error('MPD file generation failed');
      }

      res.status(201).json({
        message: 'Video uploaded successfully',
        video: {
          title,
          videoUrl,
          mpdUrl,
          iv,
          isVideoUploaded: true,
        },
      });
    } catch (error) {
      res.status(500).json({ message: 'Error processing video', error: error.message });
    }
  });
};

// Controller to Get Video by ID
exports.getVideoById = async (req, res) => {
  const { id } = req.params;

  try {
    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const licenseToken = generatePallyconToken();

    const videoKey = video.videoUrl.split('/').pop();
    const cleanVideoKey = videoKey.split('?')[0];
    const dashMpdKey = `videos/output/${cleanVideoKey.replace('.mp4', '.mpd')}`;
    const dashMpdUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${dashMpdKey}`;
    
    // Get the thumbnail URL
    // const thumbnailKey = videos/output/${cleanVideoKey.replace('.mp4', 'thumbnail.0000000.jpg')};
    // const thumbnailUrl = https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${thumbnailKey};

    res.status(200).json({
      message: 'Video retrieved successfully',
      video: {
        id: video._id,
        title: video.title,
        videoUrl: video.videoUrl,
        dashMpdUrl: dashMpdUrl,
        // thumbnailUrl: thumbnailUrl,
        isVideoUploaded: video.isVideoUploaded,
        licenseToken,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving video', error: error.message });
  }
};

// Get All Videos
exports.getVideos = async (req, res) => {
  try {
    const videos = await Video.find();

    const videosWithTokens = videos.map((video) => {
      const videoKey = video.videoUrl.split('/').pop();
      const dashMpdKey = `videos/output/${videoKey.replace('.mp4', '.mpd')}`;
      const dashMpdUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${dashMpdKey}`;

      // Construct the thumbnail URL
      const thumbnailKey = `videos/output/${videoKey.replace('.mp4', 'thumbnail.0000000.jpg')}`;
      const thumbnailUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${thumbnailKey}`;

      return {
        id: video._id,
        title: video.title,
        videoUrl: video.videoUrl,
        dashMpdUrl,
        thumbnailUrl, // Add the thumbnail URL to the response
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