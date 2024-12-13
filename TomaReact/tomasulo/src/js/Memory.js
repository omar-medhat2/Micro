class Memory {
  /**
   * Initializes the memory with a given size and random values.
   * @param {number} size - The size of the memory array.
   */
  constructor(size) {
    if (size <= 0) {
      throw new Error("[MEMORY] Invalid memory size.");
    }
    this.size = size;
    //   initialize memory with values from 0 to size-1
    //   this.data = Array.from({ length: size}, (_,i) => i);
    //   initialize memory with random values from 0 to 99
    this.data = Array.from({ length: size }, () =>
      Math.floor(Math.random() * 100)
    );
  }

  /**
   * Checks if the given address is valid.
   * @private
   * @param {number} addr - The memory address to check.
   */
  _checkAddr(addr) {
    if (addr >= this.size || addr < 0) {
      throw new Error(`[MEMORY] Invalid address "${addr}"`);
    }
  }

  /**
   * Loads the value at the given memory address.
   * @param {number} addr - The memory address to load from.
   * @returns {number} - The value at the given address.
   */
  load(addr) {
    this._checkAddr(addr);
    return this.data[addr];
  }

  /**
   * Stores a value at the given memory address.
   * @param {number} addr - The memory address to store the value at.
   * @param {number} value - The value to store.
   */
  store(addr, value) {
    this._checkAddr(addr);
    this.data[addr] = value;
  }
}

export default Memory;
