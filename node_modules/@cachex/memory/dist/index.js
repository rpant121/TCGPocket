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
  default: () => MemoryCache
});
module.exports = __toCommonJS(src_exports);
var import_core = require("@cachex/core");
var MemoryCache = class extends import_core.CacheAsbract {
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
