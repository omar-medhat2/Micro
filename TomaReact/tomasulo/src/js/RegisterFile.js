class RegisterFile {
  constructor(count, prefix) {
    this.registers = new Array(count).fill(1);
    this.count = count;
    this.prefix = prefix.toUpperCase();
  }

  _getIndex(name) {
    name = name.toUpperCase();
    if (name.substring(0, this.prefix.length) === this.prefix) {
      const index = parseInt(name.substring(this.prefix.length), 10);
      if (index >= 0 && index < this.count) {
        return index;
      }
    }
    throw new Error(`[REGISTER_FILE] Invalid register "${name}"`);
  }

  get(name) {
    return this.registers[this._getIndex(name)];
  }

  set(name, value) {
    this.registers[this._getIndex(name)] = value;
  }
}
export default RegisterFile;