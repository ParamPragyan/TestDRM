const crypto = require('crypto');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// AES Initialization Vector
const AES_IV = '0123456789abcdef'; 

// Pallycon Site and Access Information
const siteInfo = {
  siteId: process.env.PALLYCON_SITE_ID,
  // Generate a 32-byte random key (for testing only)
  siteKey: process.env.PALLYCON_SITE_KEY || crypto.randomBytes(32).toString('base64'), 
  accessKey: process.env.PALLYCON_ACCESS_KEY,
};

// Log the length and value of the generated key for testing
console.log('Generated Site Key:', siteInfo.siteKey);  // Print the site key
const decodedSiteKey = Buffer.from(siteInfo.siteKey, 'base64');
console.log('Decoded Site Key Length:', decodedSiteKey.length);  // Should print 32

if (decodedSiteKey.length !== 32) {
  console.error('Invalid Site Key length. It must be 32 bytes.');
} else {
  console.log('Valid 32-byte Site Key generated.');
}

// License Info (should be dynamic in a real-world scenario)
let licenseInfo = {
  drmType: 'Widevine',
  contentId: 'dash_mediaconvert_test',
  userId: 'Gajanan29',
};

// License Policy
let licensePolicy = {
  policy_version: 2,
  playback_policy: {
    persistent: false,
  },
};

// Encrypt the license policy using AES256
function generateEncryptedPolicy(policy) {
  const cipher = crypto.createCipheriv('aes-256-cbc', decodedSiteKey, Buffer.from(AES_IV));
  let encrypted = cipher.update(JSON.stringify(policy), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

// Generate the Pallycon License Token
function generatePallyconToken(contentId) {
  const timestamp = new Date().toISOString();
  const encryptedPolicy = generateEncryptedPolicy(licensePolicy);

  const hashInput = `${siteInfo.accessKey}${licenseInfo.drmType}${siteInfo.siteId}${licenseInfo.userId}${contentId}${encryptedPolicy}${timestamp}`;
  const hash = crypto.createHash('sha256').update(hashInput).digest('base64');

  const tokenData = {
    drm_type: licenseInfo.drmType,
    site_id: siteInfo.siteId,
    user_id: licenseInfo.userId,
    cid: contentId,
    policy: encryptedPolicy,
    timestamp,
    hash,
    response_format: 'original',
    key_rotation: false,
  };

  return Buffer.from(JSON.stringify(tokenData)).toString('base64');
}

module.exports = {
  generatePallyconToken,
};
