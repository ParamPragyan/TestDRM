const Video = require('./model');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/cloudfront-signer');
const crypto = require('crypto');
const dotenv = require("dotenv");

dotenv.config();

// AWS S3 and CloudFront configuration
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const cloudFrontDomain = 'https://d3lpiageeq2347.cloudfront.net';
const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID;
const privateKey = process.env.CLOUDFRONT_PRIVATE_KEY;

// Multer storage setup for temporary file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100000000 }, // 100MB file size limit
}).single('video');

// Function to upload a file to S3
async function uploadToS3(file) {
  try {
    const videoKey = `${Date.now()}-${file.originalname}`;
    console.log("Uploading video with key:", videoKey);

    const fileBuffer = fs.readFileSync(file.path);
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: videoKey,
      Body: fileBuffer,
      ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(uploadParams);
    await s3.send(command);

    console.log("Uploaded video to S3 successfully:", videoKey);
    return videoKey;
  } catch (error) {
    console.error("S3 Upload Error:", error.message);
    throw new Error("Failed to upload to S3");
  }
}

// Function to generate a secure signed URL
// Function to generate a secure signed URL
function generateSignedUrl(videoKey) {
  try {
    console.log("Generating signed URL for key:", videoKey);
    const expiryDate = new Date(Date.now() + 59 * 1000).toISOString(); 
    const signedUrl = getSignedUrl({
      url: `${cloudFrontDomain}/${videoKey}`,
      keyPairId,
      privateKey,
      dateLessThan: expiryDate,
    });

    // Optionally add caching headers to prevent video from being cached
    const headers = {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    };

    console.log("Generated signed URL:", signedUrl);
    return { signedUrl, headers };
  } catch (error) {
    console.error("Signed URL Error:", error.message);
    throw new Error("Failed to generate signed URL");
  }
}
// Video upload endpoint
exports.uploadVideo = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error("Video upload error:", err.message);
      return res.status(400).json({ message: 'Video upload failed', error: err.message });
    }

    const { title } = req.body;

    if (!title) {
      console.error("Missing title in request");
      return res.status(400).json({ message: 'Title is required' });
    }

    try {
      const videoKey = await uploadToS3(req.file);
      const videoUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${videoKey}`;

      const newVideo = new Video({ title, videoUrl, isVideoUploaded: true });
      await newVideo.save();

      console.log("Video saved successfully:", newVideo);
      res.status(201).json({ message: 'Video uploaded successfully', video: newVideo });
    } catch (error) {
      console.error("Error saving video:", error.message);
      res.status(500).json({ message: 'Error saving video', error: error.message });
    }
  });
};

// Get all videos endpoint
exports.getVideos = async (req, res) => {
  try {
    const videos = await Video.find();
    console.log("Retrieved videos from DB:", videos);

    const signedVideos = videos.map((video) => {
      const videoKey = video.videoUrl.split('/').pop();
      const signedUrl = generateSignedUrl(videoKey);
      console.log(`Video ${video.title} signed URL:`, signedUrl);
      return { ...video.toObject(), signedUrl };
    });

    res.status(200).json({ message: 'Videos retrieved successfully', videos: signedVideos });
  } catch (error) {
    console.error("Error retrieving videos:", error.message);
    res.status(500).json({ message: 'Error retrieving videos', error: error.message });
  }
};

// Get video by title endpoint
exports.getVideoByTitle = async (req, res) => {
  const { title } = req.params;

  try {
    const video = await Video.findOne({ title });

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const videoKey = video.videoUrl.split('/').pop();
    const signedUrl = generateSignedUrl(videoKey);

    res.status(200).json({
      message: 'Video retrieved successfully',
      video: { ...video.toObject(), signedUrl },
    });
  } catch (error) {
    console.error("Error retrieving video:", error.message);
    res.status(500).json({ message: 'Error retrieving video', error: error.message });
  }
};
