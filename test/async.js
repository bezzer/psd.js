import fs from 'fs-extra';
import path from 'path';
import stream from 'stream';
import profiler from 'v8-profiler';
import sharp from 'sharp';

import PSD, { getArtboardDetails } from '../src/psd';

import quicklook from './quicklook';

const testFile = path.join(__dirname, 'assets', '5mb.psd');
const profileFile = path.join(__dirname, `profile.${Date.now()}.cpuprofile`);
const snapshotFile = path.join(__dirname, `profile.${Date.now()}.heapsnapshot`);

const delay = t => new Promise(res => setTimeout(res, t));

function cropArtboard(sharpImage, artboard, output) {
  return new Promise((resolve, reject) => {
    const { width, height, top, left } = artboard;
    sharpImage.extract({ left, top, width, height }).png({
      adaptiveFiltering: true,
    }).toFile(output, err => {
      if (err) {
        console.log('ER', err);
        return reject(err);
      }
    });

    resolve();
  });
}

async function run(filePath) {
  profiler.startProfiling('1', true);

  const fd = await fs.open(filePath, 'r');
  const design = new PSD(fd);

  await design.parse();

  const artboards = getArtboardDetails(design);
  console.log(artboards);
  const TEMP_FILE = 'design@1x.png';

  const output = path.join(__dirname, 'previews');

  await quicklook(testFile, {
    size: Math.max(design.header.width, design.header.height),
    output,
    rename: TEMP_FILE
  });

  if (artboards.length) {
    const designImage = path.join(output, TEMP_FILE);
    const sharpImage = sharp(designImage);

    await Promise.all(
      artboards.map(artboard =>
        cropArtboard(
          sharpImage,
          artboard,
          path.join(output, `${artboard.id}@1x.png`)
        )
      )
    );

    await fs.remove(designImage);
  }
}

(async () => {
  try {
    profiler.startProfiling('1', true);

    await run(testFile);

    // const profile = profiler.stopProfiling();
    // const snapshot = profiler.takeSnapshot();

    // profile.export(async (error, result) => {
    //   await fs.writeFile(profileFile, result);
    //   profile.delete();
    // });

    // snapshot.export(async (error, result) => {
    //   await fs.writeFile(snapshotFile, result);
    //   snapshot.delete();
    // });

    await delay(2000);

    if (global.gc) {
      global.gc();
    }
  } catch (e) {
    console.error(e);
  }
})();
