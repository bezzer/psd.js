import File from './psd/file'
import LazyExecute from './psd/lazy_execute'
import Header from './psd/header'
import Resources from './psd/resources'
import LayerMask from './psd/layer_mask'
import Image from './psd/image'

import Root from './psd/nodes/root'

import { getArtboardDetails } from './psd/artboards';
export { getArtboardDetails };

export default class PSD {
  constructor(fd, options) {
    this.file = new File(fd);
    this.parsed = false;
    this.header = null;
    this.options = options;
  }

  async parse() {
    if (this.parsed) return;

    await this.parseHeader();
    await this.parseResources();
    await this.parseLayerMask();

    this.parsed = true;
  }

  tree() {
    return new Root(this);
  }

  async parseHeader() {
    this.header = new Header(this.file);
    await this.header.parse();
  }

  async parseResources() {
    this.resources = new Resources(this.file);
    await this.resources.skip();
  }

  async parseLayerMask() {
    this.layerMask = new LayerMask(this.file, this.header);
    await this.layerMask.parse();
  }

  async parseImage() {
    this.image = new Image(this.file, this.header);
    return this.image.parse();
  }
};
