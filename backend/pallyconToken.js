const crypto = require('crypto');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// AES Initialization Vector (16 bytes for AES-CBC)
const AES_IV = '0123456789abcdef';

// Pallycon Site and Access Information
const siteInfo = {
  siteId: 'HUVG', // Site ID
  siteKey: 'dFc4c1hYbFRLa0xDVTZ1ajMyczJtMzc2ZTdCVnZwd0U=', // Base64-encoded Site Key
  accessKey: 'P0kSZa1iovnJ23nTMF8HLCcR0w5U0ruD', // Access Key
};

// Decode and validate the Site Key
const decodedSiteKey = Buffer.from(siteInfo.siteKey, 'base64');
if (decodedSiteKey.length !== 32) {
  throw new Error('Invalid Site Key length. It must be 32 bytes after decoding.');
}

// License Info
const licenseInfo = {
  drmType: 'Widevine', // DRM type
  contentId: 'dash_mediaconvert_test', // Fixed Content ID
  userId: 'Gajanan29', // User ID
};

// License Policy
const licensePolicy = {
  policy_version: 2,
  playback_policy: {
    persistent: false,
    allowed_track_types: 'ALL',
  },
  security_policy: [
    {
      track_type: 'ALL',
      widevine: {
        security_level: 1, // Simplified security level for testing
      },
    },
  ],
};

// Function to encrypt the license policy using AES-256-CBC
function generateEncryptedPolicy(policy) {
  const cipher = crypto.createCipheriv('aes-256-cbc', decodedSiteKey, Buffer.from(AES_IV));
  let encrypted = cipher.update(JSON.stringify(policy), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

// Function to generate the Pallycon token
function generatePallyconToken() {
  const currentTime = new Date();
  const timestamp = currentTime.toISOString();

  // Encrypt the license policy
  const encryptedPolicy = generateEncryptedPolicy(licensePolicy);

  // Construct the hash input
  const hashInput = `${siteInfo.accessKey}${licenseInfo.drmType}${siteInfo.siteId}${licenseInfo.userId}${licenseInfo.contentId}${encryptedPolicy}${timestamp}`;
  const hash = crypto.createHash('sha256').update(hashInput).digest('base64');

  // Token data (No expiration)
  const tokenData = {
    drm_type: licenseInfo.drmType,
    site_id: siteInfo.siteId,
    user_id: licenseInfo.userId,
    cid: licenseInfo.contentId, // Fixed Content ID
    policy: encryptedPolicy,
    timestamp, // Issue time
    hash,
    response_format: 'original',
    key_rotation: false,
  };

  console.log('Generated Token:', tokenData); // Debugging
  return Buffer.from(JSON.stringify(tokenData)).toString('base64');
}

// Generate and log the token
try {
  const token = generatePallyconToken();
  console.log('Pallycon Token:', token);

  // Decode the token for debugging
  const decodedToken = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
  console.log('Decoded Token:', decodedToken);
} catch (error) {
  console.error('Error generating Pallycon Token:', error.message);
}

module.exports = {
  generatePallyconToken,
};