import fs from 'fs-extra';

import File from './psd/file'
import LazyExecute from './psd/lazy_execute'
import Header from './psd/header'
import Resources from './psd/resources'
import LayerMask from './psd/layer_mask'
import Image from './psd/image'

import Root from './psd/nodes/root'

class PSD {
  constructor(filePath) {
    this.filePath = filePath;
    this.parsed = false;
    this.header = null;
  }

  async getFileDescriptor() {
    const fd = await fs.open(this.filePath, 'r');
    this.file = new File(fd);
  }

  async parse() {
    if (this.parsed) return;

    await this._parseHeader();
    await this._parseResources();
    await this._parseLayerMask();
    await this._parseImage();

    this.parsed = true;
  }

  tree() {
    return new Root(this);
  }

  async _parseHeader() {
    this.header = new Header(this.file);
    await this.header.parse();
    // Remove the file reference
    this.header.file = undefined;
  }

  async _parseResources() {
    this.resources = new Resources(this.file);
    await this.resources.skip();
    // Remove the file reference
    this.resources.file = undefined;
  }

  async _parseLayerMask() {
    this.layerMask = new LayerMask(this.file, this.header);
    await this.layerMask.skip();
  }

  async _parseImage() {
    this.image = new Image(this.file, this.header);
    return this.image.parse();
  }
}

export default PSD
