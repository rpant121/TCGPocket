// src/index.ts
import { CacheAsbract } from "@cachex/core";
var BrowserStorageCache = class extends CacheAsbract {
  constructor(prefix, session = false) {
    super();
    this.prefix = prefix;
    try {
      window;
    } catch {
      throw new Error('The current context is not in a browser or the variable "window" is not available.');
    }
    if (session) {
      this.storage = window.sessionStorage;
    } else {
      this.storage = window.localStorage;
    }
    if (!this.storage) {
      throw new Error("window.localStorage or window.sessionStorage are unavailable.");
    }
  }
  get(key, defaultValue) {
    const raw = this.storage.getItem(this.getFinalKey(key));
    if (!raw) {
      return defaultValue != null ? defaultValue : void 0;
    }
    const item = JSON.parse(raw);
    if (item.expire && item.expire < (/* @__PURE__ */ new Date()).getTime()) {
      this.delete(key);
      return defaultValue != null ? defaultValue : void 0;
    }
    return item.data;
  }
  set(key, value, ttl) {
    let expire = void 0;
    if (ttl) {
      expire = (/* @__PURE__ */ new Date()).getTime() + ttl * 1e3;
    }
    const data = {
      data: value,
      expire
    };
    this.storage.setItem(this.getFinalKey(key), JSON.stringify(data));
    return true;
  }
  delete(key) {
    this.storage.removeItem(this.getFinalKey(key));
    return true;
  }
  clear() {
    const keys = this.keys();
    return this.deleteMultiple(keys);
  }
  has(key) {
    return !!this.storage.getItem(this.getFinalKey(key));
  }
  /**
  * get the list of keys that are in the context of this cache component
  */
  keys() {
    const list = [];
    for (let idx = 0; idx < this.storage.length; idx++) {
      const key = this.storage.key(idx);
      if (typeof key !== "string" || this.prefix && !(key == null ? void 0 : key.startsWith(`@${this.prefix}/`))) {
        continue;
      }
      list.push(key);
    }
    return list;
  }
  /**
  * retrieve the prefixed key from the original
  * @param key the original key without prefix
  * @returns the new key with the prefix if set
  */
  getFinalKey(key) {
    if (!this.prefix) {
      return key;
    }
    return `@${this.prefix}/${key}`;
  }
};
export {
  BrowserStorageCache as default
};
