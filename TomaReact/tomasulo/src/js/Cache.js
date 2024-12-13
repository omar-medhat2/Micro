class Cache {
    constructor(size) {
      this.size = size;
      this.cache = new Map();
      this.lastAccessStatus = ""; // Track last access status
    }
  
    access(address) {
      if (this.cache.has(address)) {
        this.lastAccessStatus = "Cache Hit";
        return { hit: true, value: this.cache.get(address) };
      } else {
        this.lastAccessStatus = "Cache Miss";
        return { hit: false, value: null };
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