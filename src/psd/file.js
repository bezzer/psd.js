import { jspack } from 'jspack'
import iconv from 'iconv-lite'
import fs from 'fs-extra';

export default class File {
  static FORMATS = {
    Int: {
      code: '>i',
      length: 4
    },
    UInt: {
      code: '>I',
      length: 4
    },
    Short: {
      code: '>h',
      length: 2
    },
    UShort: {
      code: '>H',
      length: 2
    },
    Float: {
      code: '>f',
      length: 4
    },
    Double: {
      code: '>d',
      length: 8
    },
    LongLong: {
      code: '>q',
      length: 8
    }
  };

  static MAX_CHUNK_SIZE = 10000000;

  constructor(fd) {
    this.fd = fd;
    this.pos = 0;
    this.chunkPos = 0;
  }

  tell() {
    if (!this.chunk) {
      return 0;
    }
    // Need to take the chunk position into account
    return this.pos - this.chunk.length + this.chunkPos;
  }

  async readChunk(length, start = this.tell()) {
    this.chunkPos = 0;
    const buffer = Buffer.alloc(length);
    const result = await fs.read(this.fd, buffer, 0, length, start);

    // Set the file position to the end of the chunk that we have just read
    this.pos = start + result.bytesRead;
    this.chunk = result.buffer;
  }

  read(length) {
    if (!this.chunk) {
      console.warn('NO CHUNK LOADED');
    }

    if (this.chunkPos + length > this.chunk.length) {
      console.warn('NOT ENOUGH DATA', this.chunkPos, length);
    }

    const data = this.chunk.slice(this.chunkPos, this.chunkPos + length);
    this.chunkPos += length;

    return data;
  }

  readf(format, len = null) {
    return jspack.Unpack(format,
      this.read(len || jspack.CalcLength(format))
    );
  }

  seek(amt, rel = false) {
    // NOTE: amt is referring to the position in the file, not the chunk.
    if (rel) {
      // If relative, we can just bump the chunk position
      this.chunkPos += amt;
      return;
    }

    this.chunkPos = amt - this.pos + this.chunk.length;
  }

  readString(length) {
    return String.fromCharCode
      .apply(null, this.read(length))
      .replace(/\u0000/g, '');
  }

  readUnicodeString(length = null) {
    if (!length) length = this.readInt();
    return iconv
      .decode(Buffer.from(this.read(length * 2)), 'utf-16be')
      .replace(/\u0000/g, '');
  }

  readByte() {
    return this.read(1)[0];
  }

  readBoolean() {
    return this.readByte() !== 0;
  }
}

// Defines all of the readers for each data type on File.
for (var format in File.FORMATS) {
  if (!File.FORMATS.hasOwnProperty(format)) continue;
  const info = File.FORMATS[format];

  (function (format, info) {
    File.prototype[`read${format}`] = function() {
      return this.readf(info.code, info.length)[0];
    }
  })(format, info)
}
