// src/CacheAbstract.ts
import { objectLoop } from "@dzeio/object-util";
var CacheAsbract = class {
  getMultiple(keys, defaultValues) {
    const res = {};
    for (let idx = 0; idx < keys.length; idx++) {
      const key = keys[idx];
      const value = this.get(key, defaultValues == null ? void 0 : defaultValues[idx]);
      if (typeof value === "undefined") {
        continue;
      }
      res[key] = value;
    }
    return res;
  }
  setMultiple(values, ttl) {
    objectLoop(values, (v, k) => {
      this.set(k, v, ttl);
    });
    return true;
  }
  deleteMultiple(keys) {
    for (const key of keys) {
      this.delete(key);
    }
    return true;
  }
};

// src/AsyncCacheAbstract.ts
import { objectMap } from "@dzeio/object-util";
var AsyncCacheAsbract = class {
  async getMultiple(keys, defaultValues) {
    const res = {};
    for (let idx = 0; idx < keys.length; idx++) {
      const key = keys[idx];
      const value = await this.get(key, defaultValues == null ? void 0 : defaultValues[idx]);
      if (typeof value === "undefined") {
        continue;
      }
      res[key] = value;
    }
    return res;
  }
  async setMultiple(values, ttl) {
    await Promise.all(objectMap(values, (v, k) => {
      return this.set(k, v, ttl);
    }));
    return true;
  }
  async deleteMultiple(keys) {
    for await (const key of keys) {
      await this.delete(key);
    }
    return true;
  }
};
export {
  AsyncCacheAsbract as AsyncCacheAbsract,
  CacheAsbract
};
/*!
 * Library based on the awesome PHP Psr 16 SimpleCache
 *
 * CacheX is a simple, easy to use and meant to be replaceable Cache library for most usage
 */
