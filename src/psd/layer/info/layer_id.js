import LayerInfo from './base';

export default class LayerId extends LayerInfo {
  static name = 'layerId';
  static shouldParse(key) {
    return key === 'lyid';
  }

  parse() {
    this.id = this.file.readInt();
  }
}
