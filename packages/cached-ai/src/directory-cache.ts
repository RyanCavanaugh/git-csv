import { createHash } from "node:crypto";
import { join } from "node:path";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { statSync } from "node:fs";

export function createCache(rootDir: string) {
    async function writeCacheFile(key: string, value: string): Promise<void> {
        await mkdir(getDirForKey(key), { recursive: true });
        await writeFile(getFullPathOfKey(key), value, "utf-8");
    }

    async function cacheFileExists(key: string): Promise<boolean> {
        return await fileExists(getFullPathOfKey(key));
    }

    async function fileExists(path: string) {
        return statSync(path, { throwIfNoEntry: false }) !== undefined;
    }

    async function tryReadCacheFile(key: string): Promise<string | undefined> {
        const path = getFullPathOfKey(key);
        if (await fileExists(path)) {
            return await readFile(path, 'utf-8');
        } else {
            return undefined;
        }
    }

    async function readCacheFile(key: string): Promise<string | undefined> {
        return await readFile(getFullPathOfKey(key), 'utf-8');
    }

    return ({
        writeCacheFile,
        cacheFileExists,
        tryReadCacheFile,
        readCacheFile,
    });

    function getFullPathOfKey(key: string) {
        const loc = getFileLocation(key);
        return join(getDirForKey(key), loc.fileName);
    }
    function getDirForKey(key: string) {
        const loc = getFileLocation(key);
        return join(rootDir, loc.level1, loc.level2);
    }
}

function hash(key: string) {
    debugger;
    // Math: If we want to support 100,000,000 items with a 99.999% chance of
    // not ever having a collision, we need about 1e21 buckets, or 70 bits.
    // Each hex digit gets us 4 bits = 17.5 digits, round up to 20
    return createHash('sha256').update(key).digest('hex').substring(0, 20);

}

function getFileLocation(key: string) {
    const result = hash(key);
    // Slice by threes = Up to 4,096 directories on each level. Files per dir scales up to whatever
    // the total count is
    return {
        level1: result.substring(0, 3),
        level2: result.substring(3, 6),
        fileName: result.substring(6)
    }
}
