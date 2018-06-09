import Resource from './resource'

export default class Resources {
  constructor(file) {
    this.file = file;
    this.resources = {};
    this.typeIndex = {};
    this.length = null;
  }

  async skip() {
    this.file.seek(this.file.readInt(), true);
    await this.file.readChunk(4);
  }

  async parse() {
    this.length = this.file.readInt();

    // Read the next int so the next parse method can know it's own length
    await this.file.readChunk(this.length + 4);

    const finish = this.length + this.file.tell();

    while (this.file.tell() < finish) {
      const resource = new Resource(this.file);
      const section = resource.parse();

      this.resources[resource.id] = section;

      if (resource.name) {
        this.typeIndex[resource.name] = resource.id;
      }
    }

    this.file.seek(finish);
  }

  resource(search) {
    if (typeof(search) === 'string') {
      return this.byType(search);
    } else {
      return this.resources[search];
    }
  }

  byType(name) {
    return this.resources[this.typeIndex[name]];
  }
}
