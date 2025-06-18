import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const CACHE_DIR = path.resolve(import.meta.dirname, '../../../.kvcache');

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

function getCacheFilePath(hash: string): string {
  const subdir = hash.slice(0, 2);
  return path.join(CACHE_DIR, subdir, hash.substring(2, 12) + '.json');
}

export async function getOrRetrieve<T>(key: string, retriever: (key: string) => Promise<T>): Promise<T> {
  const hash = hashKey(key);
  const filePath = getCacheFilePath(hash);
  const stat = await fs.stat(filePath).catch(() => undefined);
  if (stat && stat.isFile()) {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data) as T;
  }
  // Not found, compute and cache
  const value = await retriever(key);
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(value), 'utf8');
  return value;
}
