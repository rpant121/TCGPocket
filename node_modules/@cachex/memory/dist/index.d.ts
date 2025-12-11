import { CacheAsbract } from '@cachex/core';

/**
 * Memory cache implementation that stores cached items in memory.
 * This class extends the abstract `CacheAbstract` and provides a basic in-memory caching mechanism.
 *
 * @class MemoryCache
 */
declare class MemoryCache extends CacheAsbract {
    private cache;
    get<T>(key: string, defaultValue?: T | undefined): T | undefined;
    set<T>(key: string, value: T, ttl?: number | undefined): boolean;
    delete(key: string): boolean;
    clear(): boolean;
    has(key: string): boolean;
}

export { MemoryCache as default };
