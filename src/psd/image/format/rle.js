import fs from 'fs-extra';
import path from 'path';
import profiler from 'v8-profiler';

async function parseRLE(image) {
  const rle = new RLECompression(image);
  return rle.parse();
}

class RLECompression {
  byteCounts = null;
  chanPos = 0;
  lineIndex = 0;

  constructor(image) {
    this.image = image;
  }

  async parse() {
    await this._parseByteCounts();
    await this._parseChannelData();
  }

  async _parseByteCounts() {
    const { image } = this;
    const { file } = image;
    const channelRows = image.header.channels * image.header.height;
    let byteCounts = [];

    await file.readChunk(channelRows * 2);

    for (var i = 0; i < channelRows; i++) {
      byteCounts.push(file.readShort());
    }
    this.byteCounts = byteCounts;
  }

  async _parseChannelData() {
    const channels = this.image.header.channels;
    const height = this.image.header.height;

    const decodePromises = [];

    for (var i = 0; i < channels; i++) {
      const snapshot = profiler.takeSnapshot();

      await this._decodeRLEChannel(i)

      snapshot.export(async (error, result) => {
        await fs.writeFile(path.join(process.cwd(), 'test', `profile.${Date.now()}.heapsnapshot`), result);
        snapshot.delete();
      });
    };
  }

  async _decodeRLEChannel(index) {
    const { image } = this;
    const { file } = image;
    const height = image.header.height;
    let byteCount, finish, len, val;

    let bytesToRead = 0;
    let k = 0;
    for(; k < height; k++) {
      bytesToRead += this.byteCounts[this.lineIndex + k];
    }

    await file.readChunk(bytesToRead);

    let j = 0;
    for(; j < height; j++) {
      byteCount = this.byteCounts[this.lineIndex + j];
      finish = file.tell() + byteCount;

      while (file.tell() < finish) {
        len = file.readByte();

        if (len < 128) {
          len += 1;
          image.channelData.splice(this.chanPos, 0, ...file.read(len));
          this.chanPos += len;
        } else if (len > 128) {
          len ^= 0xff;
          len += 2;

          val = file.readByte();

          for (let i = 0; i < len; i++) {
            image.channelData[this.chanPos++] = val;
          }
        }
      }
    }

    this.lineIndex += this.image.header.height;
  }
}

export { parseRLE }
