const fs = require('fs');
const path = require('path');

function resolveUploadDirectory() {
  const rawEnvPath = String(process.env.UPLOAD_DIR || '').trim();

  if (rawEnvPath) {
    return path.isAbsolute(rawEnvPath)
      ? rawEnvPath
      : path.resolve(process.cwd(), rawEnvPath);
  }

  // Render free instances work reliably with /tmp for runtime uploads.
  if (process.env.RENDER) {
    return '/tmp/gowithsu-images';
  }

  return path.join(__dirname, '..', 'Images');
}

function ensureUploadDirectory() {
  const uploadDir = resolveUploadDirectory();
  fs.mkdirSync(uploadDir, { recursive: true });
  return uploadDir;
}

module.exports = {
  resolveUploadDirectory,
  ensureUploadDirectory
};
