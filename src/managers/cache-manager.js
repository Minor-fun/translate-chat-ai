const fs = require('fs').promises;
const path = require('path');

/**
 * Cache key parser utilities
 */
const CacheKeyParser = {
  parse(key) {
    if (!key || typeof key !== 'string') {
      return { context: '', from: 'unknown', to: 'unknown', text: '' };
    }

    const parts = key.split(':');
    let context = '';
    let langStartIndex = 0;

    if (parts.length > 0 && (parts[0] === 'SEND' || parts[0] === 'RECV')) {
      context = parts[0];
      langStartIndex = 1;
    }

    return {
      context,
      from: parts[langStartIndex] || 'unknown',
      to: parts[langStartIndex + 1] || 'unknown',
      text: parts.length > langStartIndex + 2 ? parts.slice(langStartIndex + 2).join(':') : ''
    };
  },

  generate(from, to, text, context = '') {
    let prefix = '';
    if (context === 'send') prefix = 'SEND:';
    else if (context === 'receive') prefix = 'RECV:';
    else if (context) prefix = `${context.toUpperCase()}:`;
    return `${prefix}${from}:${to}:${text}`;
  },

  matches(key, criteria) {
    if (!criteria) return true;
    const parsed = this.parse(key);

    if (criteria.from && parsed.from !== criteria.from) return false;
    if (criteria.to && parsed.to !== criteria.to) return false;
    if (criteria.context && parsed.context !== criteria.context.toUpperCase()) return false;
    if (criteria.keyword && !key.toLowerCase().includes(criteria.keyword.toLowerCase())) return false;

    return true;
  }
};

class CacheManager {
  constructor(config = {}) {
    this.config = {};
    this.cache = new Map();
    this.head = {};
    this.tail = {};
    this.head.next = this.tail;
    this.tail.prev = this.head;
    this.stats = {
      hits: 0,          // Cache hits
      misses: 0,        // Cache misses
      saves: 0,         // Save to file count
      errors: 0,        // Error count 
      evicted: 0,       // Entries evicted by LRU
      added: 0          // Newly added entries
    };
    this.modified = false;
    this.modCount = 0;
    this.autoSaveTimer = null;
    this.writeLock = false;

    // Initialize config
    this.updateConfig(config);
  }

  // Logging disabled - no-op
  log() { }

  // Initialization and config management
  async init() {
    try {
      await this.loadFromFile();
      this._startAutoSaveTimer();
      this.log('info', 'Cache initialized');
    } catch (error) {
      this.log('error', `Failed to initialize cache: ${error.message}`);
    }
    return this;
  }

  updateConfig(newConfig) {
    const oldInterval = this.config.autoSaveInterval;
    Object.assign(this.config, newConfig);

    // Set defaults if missing
    if (this.config.maxSize === undefined) this.config.maxSize = 20000;
    if (this.config.autoSaveInterval === undefined) this.config.autoSaveInterval = 10;
    if (this.config.writeThreshold === undefined) this.config.writeThreshold = 100;
    if (this.config.cleanupPercentage === undefined) this.config.cleanupPercentage = 0.2;

    // Use provided cachePath directly (can be absolute or relative)
    if (this.config.cachePath) {
      this.cacheFilePath = this.config.cachePath;
    }

    if (oldInterval !== this.config.autoSaveInterval) this._startAutoSaveTimer();
  }

  _startAutoSaveTimer() {
    if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);

    // Config stores minutes, convert to ms
    const intervalMinutes = this.config.autoSaveInterval;
    if (intervalMinutes > 0) {
      // Simply convert to ms
      const intervalMs = intervalMinutes * 60 * 1000;

      this.log('info', `Set auto-save interval: ${intervalMinutes} minutes`);
      this.autoSaveTimer = setInterval(() => {
        if (this.modified) this.saveToFile();
      }, intervalMs);

      if (this.autoSaveTimer.unref) this.autoSaveTimer.unref();
    }
  }

  destroy() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  // Generate cache key
  generateKey(text, from, to, context) {
    return CacheKeyParser.generate(from, to, text, context);
  }

  // Simplified LRU operation
  _moveToFront(node) {
    if (node.prev) {
      node.prev.next = node.next;
      node.next.prev = node.prev;
    }
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
    this.modified = true;
  }

  _removeTail() {
    if (this.head.next === this.tail) return null;
    const node = this.tail.prev;
    node.prev.next = this.tail;
    this.tail.prev = node.prev;
    node.prev = node.next = null;
    return node;
  }

  // Cache operations
  get(key) {
    if (this.config.enabled === false) return null;

    const node = this.cache.get(key);
    if (node) {
      this._moveToFront(node);
      this.stats.hits++;
      this.log('debug', `Hit: ${key.substring(0, 20)}...`);
      return node.value.result;
    }

    this.stats.misses++;
    this.log('debug', `Miss: ${key.substring(0, 20)}...`);
    return null;
  }

  set(key, result) {
    if (this.config.enabled === false) return;

    let node = this.cache.get(key);

    if (node) {
      // Update existing node
      node.value = { result: result, time: Date.now() };
    } else {
      // Create new node
      if (this.cache.size >= this.config.maxSize) this._batchCleanup();
      node = {
        key,
        value: { result: result, time: Date.now() }
      };
      this.cache.set(key, node);
      this.stats.added++;
    }

    this._moveToFront(node);
    this.modified = true;

    const writeThreshold = this.config.writeThreshold;
    if (++this.modCount >= writeThreshold) {
      this.saveToFile();
      this.modCount = 0;
    }
  }

  _batchCleanup() {
    const maxSize = this.config.maxSize;
    const cleanupPercentage = this.config.cleanupPercentage;
    const cleanupCount = Math.floor(maxSize * cleanupPercentage);
    if (cleanupCount <= 0) return;

    this.log('info', `Cleanup ${cleanupCount} least recently used entries`);

    // Optimization: Detach N nodes from tail at once
    if (cleanupCount > 0 && this.tail.prev !== this.head) {
      // Find new tail position
      let newTail = this.tail.prev;
      let nodesToRemove = [];
      let count = 0;

      // Collect nodes to remove
      for (let i = 0; i < cleanupCount; i++) {
        if (newTail === this.head) break;
        nodesToRemove.push(newTail);
        newTail = newTail.prev;
        count++;
      }

      if (count > 0) {
        // Detach list connection at once
        newTail.next = this.tail;
        this.tail.prev = newTail;

        // Batch process node deletion
        for (const oldNode of nodesToRemove) {
          this.cache.delete(oldNode.key);
          oldNode.prev = oldNode.next = null; // Help GC
          this.stats.evicted++;
        }
      }
    }

    this.modified = true;
    this.saveToFile();
  }

  clear() {
    const oldSize = this.cache.size;
    this.cache.clear();
    this.head.next = this.tail;
    this.tail.prev = this.head;
    this.stats = {
      hits: 0,
      misses: 0,
      saves: 0,
      errors: 0,
      evicted: 0,
      added: 0
    };
    this.modified = true;

    this.log('info', `Cache cleared (${oldSize} entries)`);
    this.saveToFile();
  }

  // Search cache content by keyword
  search(keyword, limit = 10) {
    if (!keyword || typeof keyword !== 'string') return [];

    const results = [];
    const lowerKeyword = keyword.toLowerCase();

    for (let node = this.head.next; node !== this.tail && results.length < limit; node = node.next) {
      const key = node.key || '';
      const result = node.value.result || '';

      if (key.toLowerCase().includes(lowerKeyword) || result.toLowerCase().includes(lowerKeyword)) {
        const parsed = CacheKeyParser.parse(key);

        results.push({
          from: parsed.from,
          to: parsed.to,
          context: parsed.context,
          text: parsed.text.substring(0, 50) + (parsed.text.length > 50 ? '...' : ''),
          result: result.substring(0, 50) + (result.length > 50 ? '...' : ''),
          time: new Date(node.value.time).toLocaleString()
        });
      }
    }

    return results;
  }

  // Selectively clear cache
  clearSelected(criteria) {
    if (!criteria) return 0;

    let count = 0;
    const nodesToRemove = [];

    // Map criteria to CacheKeyParser format
    const parsedCriteria = {
      from: criteria.fromLang || criteria.from,
      to: criteria.toLang || criteria.to,
      keyword: criteria.keyword
    };

    for (let node = this.head.next; node !== this.tail; node = node.next) {
      const key = node.key || '';
      const result = node.value.result || '';

      // Check time criteria separately
      if (criteria.before && node.value.time >= criteria.before) {
        continue;
      }

      // Use CacheKeyParser for matching
      if (CacheKeyParser.matches(key, parsedCriteria)) {
        // Additional keyword check on result
        if (parsedCriteria.keyword && !result.toLowerCase().includes(parsedCriteria.keyword.toLowerCase())) {
          if (!key.toLowerCase().includes(parsedCriteria.keyword.toLowerCase())) {
            continue;
          }
        }
        nodesToRemove.push(node);
      } else if (criteria.before) {
        // Time-only criteria
        nodesToRemove.push(node);
      }
    }

    // Batch delete
    for (const node of nodesToRemove) {
      if (node.prev) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
        this.cache.delete(node.key);
        count++;
      }
    }

    if (count > 0) {
      this.modified = true;
      this.log('info', `Selectively cleared ${count} entries`);
      this.saveToFile();
    }

    return count;
  }

  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests * 100).toFixed(2) + '%' : '0%';

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      enabled: this.config.enabled !== false,
      modified: this.modified,
      autoSaveInterval: this.config.autoSaveInterval,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: hitRate,
      saves: this.stats.saves,
      added: this.stats.added
    };
  }

  setEnabled(enabled) {
    this.config.enabled = enabled;
    this.log('info', `Cache ${enabled ? 'enabled' : 'disabled'}`);
  }

  async loadFromFile() {
    try {
      const data = await fs.readFile(this.cacheFilePath, 'utf8');
      const entries = JSON.parse(data);

      if (!Array.isArray(entries)) {
        this.log('warn', 'Cache file format invalid, starting with empty cache');
        return;
      }

      this.cache.clear();
      this.head.next = this.tail;
      this.tail.prev = this.head;

      let count = 0;
      // Load entries (assuming they are in order of LRU, if not, it's fine)
      for (const entry of entries) {
        if (!entry.key || !entry.result) continue;

        const node = {
          key: entry.key,
          value: {
            result: entry.result,
            time: entry.time || Date.now()
          }
        };

        this.cache.set(entry.key, node);

        // Add to front of list
        node.next = this.head.next;
        node.prev = this.head;
        this.head.next.prev = node;
        this.head.next = node;

        count++;
      }

      this.log('info', `Loaded ${count} cache entries from file`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        this.log('error', `Failed to load cache: ${error.message}`);
      } else {
        this.log('info', 'No cache file found, starting new');
      }
    }
  }

  async saveToFile() {
    if (!this.modified) return Promise.resolve(true);

    if (this.writeLock) {
      this.log('info', `Write operation in progress, skipping save`);
      return Promise.resolve(false);
    }

    this.writeLock = true;

    try {
      const entries = [];
      // Traverse from tail (LRU) to head (MRU) or vice versa? 
      // Saving MRU first (head.next) is usually better if we preserve order on load
      let lruIndex = 0;
      for (let node = this.head.next; node !== this.tail; node = node.next) {
        entries.push({
          key: node.key,
          result: node.value.result,
          time: node.value.time,
          lru: lruIndex++
        });
      }

      await fs.mkdir(path.dirname(this.cacheFilePath), { recursive: true });

      // Format as JSON array with one entry per line, no newline after [ or before ]
      const jsonContent = '[' + entries.map(e => JSON.stringify(e)).join(',\n') + ']';
      await fs.writeFile(this.cacheFilePath, jsonContent, 'utf8');

      this.modified = false;
      this.stats.saves++;
      this.log('info', `Saved ${entries.length} cache entries`);

      this.writeLock = false;
      return true;
    } catch (error) {
      this.writeLock = false;
      this.stats.errors++;
      this.log('error', `Failed to save cache: ${error.message}`);
      return false;
    }
  }
}

// Create default instance - Use empty config, will update from settings later
const defaultCacheManager = new CacheManager();

module.exports = { CacheManager, defaultCacheManager };