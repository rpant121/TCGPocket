"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  AsyncCacheAbsract: () => AsyncCacheAsbract,
  CacheAsbract: () => CacheAsbract
});
module.exports = __toCommonJS(src_exports);

// src/CacheAbstract.ts
var import_object_util = require("@dzeio/object-util");
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
    (0, import_object_util.objectLoop)(values, (v, k) => {
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
var import_object_util2 = require("@dzeio/object-util");
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
    await Promise.all((0, import_object_util2.objectMap)(values, (v, k) => {
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AsyncCacheAbsract,
  CacheAsbract
});
/*!
 * Library based on the awesome PHP Psr 16 SimpleCache
 *
 * CacheX is a simple, easy to use and meant to be replaceable Cache library for most usage
 */
