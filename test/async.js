import fs from 'fs';
import path from 'path';
import stream from 'stream';
import profiler from 'v8-profiler';
import quicklook from '../quicklook';

import PSD from '../src/psd';
import File from '../src/psd/file';
import { PNG } from '../src/node';

const testFile = path.join(__dirname, 'assets', '260mb.psd');
const profileFile = path.join(__dirname, `profile.${Date.now()}.cpuprofile`);
const snapshotFile = path.join(__dirname, `profile.${Date.now()}.heapsnapshot`);

const delay = t => new Promise(res => setTimeout(res, t));

async function run(filePath) {
  profiler.startProfiling('1', true);

  const design = new PSD(filePath);

  await design.getFileDescriptor();

  await design._parseHeader();

  return quicklook(testFile, {
    size: design.header.height,
    scale: 2,
    output: path.join(__dirname),
  });

  // return PNG.saveAsPng(design.image, path.join(__dirname, `test.${Date.now()}.png`));
}

(async () => {
  try {
    profiler.startProfiling('1', true);

    await run(testFile);

    const profile = profiler.stopProfiling();
    // const snapshot = profiler.takeSnapshot();

    profile.export(async (error, result) => {
      await fs.writeFile(profileFile, result);
      profile.delete();
    });

    // snapshot.export(async (error, result) => {
    //   await fs.writeFile(snapshotFile, result);
    //   snapshot.delete();
    // });

    await delay(2000)

    if (global.gc) {
      global.gc();
    }

  } catch (e) {
    console.error(e);
  }
})();
