import { pad2 } from './util'
import Layer from './layer'

export default class LayerMask {
  layers = []
  mergedAlpha = false
  globalMask = null

  constructor(file, header) {
    this.file = file;
    this.header = header;
  }

  async skip() {
    this.file.seek(this.file.readInt(), true);
    await this.file.readChunk(4);
  }

  async parse() {
    const maskSize = this.file.readInt();
    const finish = maskSize + this.file.tell();

    // Read the next int so the next parse method can know it's own length
    await this.file.readChunk(maskSize + 4);

    if (maskSize <= 0) return;

    this._parseLayers();
    this._parseGlobalMask();

    this.layers.reverse();

    this.file.seek(finish);
  }

  _parseLayers() {
    const layerInfoSize = pad2(this.file.readInt());

    if (layerInfoSize > 0) {
      let layerCount = this.file.readShort();

      if (layerCount < 0) {
        layerCount = Math.abs(layerCount);
        this.mergedAlpha = true;
      }

      let layer;
      for (var i = 0; i < layerCount; i++) {
        layer = new Layer(this.file, this.header);
        layer.parse();

        this.layers.push(layer);
      }

      // Channel images come after all of the layer data
      this.layers.forEach(layer => layer.parseChannelImage());
    }
  }

  _parseGlobalMask() {
    const { file } = this;
    const length = file.readInt();
    if (length <= 0) return;

    const maskEnd = file.tell() + length;

    const overlayColorSpace = file.readShort();
    const colorComponents = [
      file.readShort() >> 8,
      file.readShort() >> 8,
      file.readShort() >> 8,
      file.readShort() >> 8
    ];

    const opacity = file.readShort() / 16.0;
    const kind = file.readByte();

    this.globalMask = {
      overlayColorSpace,
      colorComponents,
      opacity,
      kind
    };

    file.seek(maskEnd);
  }
}
