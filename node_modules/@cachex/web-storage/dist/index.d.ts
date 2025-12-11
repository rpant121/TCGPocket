import { CacheAsbract } from '@cachex/core';

/**
 * A cache implementation that uses browser storage.
 *
 * This class extends `CacheAsbract` and provides a concrete implementation
 * of the caching interface. It stores cached items in browser storage,
 * which is suitable for storing small amounts of data.
 */
declare class BrowserStorageCache extends CacheAsbract {
    private readonly prefix?;
    private storage;
    constructor(prefix?: string | undefined, session?: boolean);
    get<T>(key: string, defaultValue?: T | undefined): T | undefined;
    set<T>(key: string, value: T, ttl?: number | undefined): boolean;
    delete(key: string): boolean;
    clear(): boolean;
    has(key: string): boolean;
    /**
    * get the list of keys that are in the context of this cache component
    */
    private keys;
    /**
    * retrieve the prefixed key from the original
    * @param key the original key without prefix
    * @returns the new key with the prefix if set
    */
    private getFinalKey;
}

export { BrowserStorageCache as default };
