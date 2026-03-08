// Media bucket configuration for VPS
// Images and videos served from /uploads directory
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');

// Ensure directories exist
const mediaDirs = ['images', 'videos', 'documents', 'avatars', 'receipts'];

function initMediaBucket() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
  mediaDirs.forEach(dir => {
    const dirPath = path.join(UPLOAD_DIR, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  });
  console.log(`📁 Media bucket initialized: ${UPLOAD_DIR}`);
  console.log(`   Subdirectories: ${mediaDirs.join(', ')}`);
}

module.exports = { UPLOAD_DIR, mediaDirs, initMediaBucket };
