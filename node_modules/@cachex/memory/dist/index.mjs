// src/index.ts
import { CacheAsbract } from "@cachex/core";
var MemoryCache = class extends CacheAsbract {
  constructor() {
    super(...arguments);
    this.cache = /* @__PURE__ */ new Map();
  }
  get(key, defaultValue) {
    const item = this.cache.get(key);
    if (typeof item === "undefined") {
      return defaultValue != null ? defaultValue : void 0;
    }
    if (item.expire && item.expire < (/* @__PURE__ */ new Date()).getTime()) {
      this.delete(key);
      return defaultValue != null ? defaultValue : void 0;
    }
    return item.data;
  }
  set(key, value, ttl) {
    let expire;
    if (ttl) {
      expire = (/* @__PURE__ */ new Date()).getTime() + ttl * 1e3;
    }
    this.cache.set(key, {
      data: value,
      expire
    });
    return true;
  }
  delete(key) {
    this.cache.delete(key);
    return true;
  }
  clear() {
    this.cache.clear();
    return true;
  }
  has(key) {
    return this.cache.has(key);
  }
};
export {
  MemoryCache as default
};
