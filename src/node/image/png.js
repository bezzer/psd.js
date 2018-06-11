import fs from 'fs-extra';
import sharp from 'sharp';

function saveAsPng(image, path) {
  const transformer = sharp(null, {
    raw: {
      width: image.width,
      height: image.height,
      channels: 4,
    }
  }).toFormat('png');

  const writableStream = fs.createWriteStream(path);

  image.startStream();

  return new Promise((resolve, reject) => {
    image.pixelData
      .pipe(transformer)
      .pipe(writableStream)
      .on('error', reject)
      .on('finish', resolve);
  });
}

export { saveAsPng };
