import { Readable } from 'stream';
import { setRgbChannels, combineRgbChannel } from './image/mode/rgb'
import { setCmykChannels, combineCmykChannel } from './image/mode/cmyk'
import { setGreyscaleChannels, combineGreyscaleChannel } from './image/mode/greyscale'

import { parseRaw } from './image/format/raw'
import { parseRLE } from './image/format/rle'

export default class Image {
  static COMPRESSIONS = [
    'Raw',
    'RLE',
    'ZIP',
    'ZIPPrediction'
  ];

  pixelData = new Readable();
  channelData = [];
  opacity = 1.0;
  hasMask = false;

  constructor(file, header) {
    this.file = file;
    this.header = header;

    this.width = this.header.width;
    this.height = this.header.height;
    this.numPixels = this.header.width * this.header.height;
    if (this.header.depth === 16) this.numPixels *= 2;
  }

  async parse() {
    this._calculateLength();
    this._setChannelsInfo();

    this.startPos = this.file.tell();
    this.endPos = this.startPos + this.length;

    // We should already have the compression data, so don't need to read
    // further into the file.
    this.compression = this._parseCompression();
    if ([2, 3].includes(this.compression)) {
      this.file.seek(endPos);
      return;
    }

    await this._parseImageData();
  }

  startStream() {
    this._processImageData();
  }

  _calculateLength() {
    if (this.header.depth === 1) {
      this.length = (this.header.width + 7) / 8 * this.header.height;
    } else if (this.header.depth === 16) {
      this.length = this.header.width * this.header.height * 2;
    } else {
      this.length = this.header.width * this.header.height;
    }

    this.channelLength = this.length;
    this.length *= this.header.channels;
  }

  _setChannelsInfo() {
    switch (this.header.mode) {
      case 1: return setGreyscaleChannels(this);
      case 3: return setRgbChannels(this);
      case 4: return setCmykChannels(this);
    }
  }

  _parseCompression() {
    return this.file.readShort();
  }

  async _parseImageData() {
    switch (this.compression) {
      case 0: return parseRaw(this);
      case 1: return parseRLE(this);
      case 2:
      case 3: return parseZip(this);
      default: this.file.seek(endPos);
    }
  }

  _processImageData() {
    switch (this.header.mode) {
      case 1: return combineGreyscaleChannel(this);
      case 3: return combineRgbChannel(this);
      case 4: return combineCmykChannel(this);
    }

    // Free up this chunk of memory
    this.channelData = null;
  }
}
