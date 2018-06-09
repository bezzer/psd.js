import fs from 'fs';
import path from 'path';
import stream from 'stream';
import memwatch from 'memwatch-next';
import sizeof from 'object-sizeof';

import PSD from '../src/psd';
import File from '../src/psd/file';
import { PNG } from '../src/node';

let hd = new memwatch.HeapDiff();
const testFile = path.join(__dirname, 'assets', '5mb.psd');

const delay = t => new Promise(res => setTimeout(res, t));

const logHeap = (step, startAgain = true) => {
  const diff = hd.end();
  console.log(`${step} - Before: ${diff.before.size} After ${diff.after.size}`);

  if (startAgain) {
    hd = new memwatch.HeapDiff();
  }
}

async function run(filePath) {
  const design = new PSD(filePath);
  logHeap('HAS FILE');
  await design.getFileDescriptor();
  await design.parse();

  // NOTE: this take a while to calculate
  // console.log(sizeof(design.image.pixelData));

  logHeap('PARSED FILE');
  // console.log(design);
  return PNG.saveAsPng(design.image, path.join(__dirname, `test.${Date.now()}.png`));
}

(async () => {
  try {
    await run(testFile);
    logHeap('SAVED FILE');

    await delay(2000)

    if (global.gc) {
      global.gc();
      console.log('COLLECTED');
    }

    logHeap('DONE', false);
  } catch (e) {
    console.error(e);
  }
})();
