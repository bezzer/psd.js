import LazyExecute from './lazy_execute'
import ChannelImage from './channel_image'

import parsePositionAndChannels from './layer/position_channels'
import parseBlendModes from './layer/blend_modes'
import parseMaskData from './layer/mask_data'
import parseBlendingRanges from './layer/blending_ranges'
import parseLegacyLayerName from './layer/legacy_name'
import parseLayerInfo from './layer/info'

export default class Layer {
  mask = {}
  blendingRanges = {}
  adjustments = {}
  channelsInfo = []
  blendMode = {}
  groupLayer = null

  availableInfoKeys = []
  parsedInfoKeys = []

  constructor(file, header) {
    this.file = file;
    this.header = header;

    Object.defineProperty(this, 'name', {
      get: function () {
        if (this.adjustments.name) {
          return this.adjustments.name.data;
        } else {
          return this.legacyName;
        }
      }
    })
  }

  parse() {
    parsePositionAndChannels(this);
    parseBlendModes(this);

    this.layerSize = this.file.readInt();
    this.layerEnd = this.file.tell() + this.layerSize;

    parseMaskData(this);
    parseBlendingRanges(this);
    parseLegacyLayerName(this);
    parseLayerInfo(this);
  }

  parseChannelImage() {
    const image = new ChannelImage(this);
    this.image = new LazyExecute(image, this.file)
      .now('skip')
      .later('parse')
      .get();
  }

  isFolder() {
    if (this.adjustments.sectionDivider) {
      return this.adjustments.sectionDivider.isFolder;
    } else if (this.adjustments.nestedSectionDivider) {
      return this.adjustments.nestedSectionDivider.isFolder;
    } else {
      return this.name === "<Layer group>";
    }
  }

  isFolderEnd() {
    if (this.adjustments.sectionDivider) {
      return this.adjustments.sectionDivider.isHidden;
    } else if (this.adjustments.nestedSectionDivider) {
      return this.adjustments.nestedSectionDivider.isHidden;
    } else {
      return this.name === "</Layer group>";
    }
  }
}
