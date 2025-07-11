const sharp = require('sharp');
const path = require('path');

exports.generateThumbnail = async (absPath, size = 150) => {
  const ext = path.extname(absPath);
  const thumbPath = absPath.replace(ext, `_thumb${ext}`);
  await sharp(absPath).resize(size, size).toFile(thumbPath);
};
