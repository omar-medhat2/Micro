class Cache {
  constructor(size, missPenalty) {
    this.size = size;
    this.cache = new Map();
    this.missPenalty = missPenalty; // Penalty for cache misses
    this.lastAccessStatus = ""; // Track last access status
  }

  access(address) {
    if (this.cache.has(address)) {
      this.lastAccessStatus = "Cache Hit";
      console.log(`Cache Hit: Address ${address}`);
      return { hit: true, value: this.cache.get(address), penalty: 0 };
    } else {
      this.lastAccessStatus = "Cache Miss";
      console.log(`Cache Miss: Address ${address}, Penalty: ${this.missPenalty}`);
      return { hit: false, value: null, penalty: this.missPenalty };
    }
  }

  update(address, value) {
    if (this.cache.size >= this.size) {
      // Simple eviction policy (FIFO)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(address, value);
  }

  getCache() {
    return Array.from(this.cache.entries());
  }
}

export default Cache;