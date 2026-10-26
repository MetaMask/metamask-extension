import { createHash } from 'crypto';
import { MINUTE } from '@metamask/controller-utils';
import {
  getStorageItem,
  getStorageKeysWithPrefix,
  removeStorageItem,
  setStorageItem,
} from '../../../../shared/lib/storage-helpers';

const BRIDGE_CACHE_PREFIX = 'bridgeCache';
const MAX_CACHE_AGE = MINUTE * 15;
const DEFAULT_CACHE_PAGE_KEY = 'default';

type CachedPage = {
  cachedResponse: object;
  hash: string;
};

type BridgeCacheStorage = {
  timestamp: number;
} & Record<string, CachedPage | number | undefined>;

const hashData = (body: object) => {
  return createHash('sha256').update(JSON.stringify(body)).digest('hex');
};

export const getCacheKey = (url: string, body: object) => {
  const bodyHash = hashData(body);
  return `${BRIDGE_CACHE_PREFIX}:${url}:${bodyHash}`;
};

const isStale = (cachedItem: { timestamp: number }) =>
  cachedItem.timestamp && Date.now() - cachedItem.timestamp >= MAX_CACHE_AGE;

const isCachedPage = (value: unknown): value is CachedPage => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'hash' in value &&
    'cachedResponse' in value
  );
};

export const retrieveCachedResponse = async (
  cacheKey: string,
  after: string = DEFAULT_CACHE_PAGE_KEY,
) => {
  try {
    const storageItem = await getStorageItem<BridgeCacheStorage>(cacheKey);
    const cachedPage = storageItem?.[after];

    if (isCachedPage(cachedPage)) {
      const { hash, cachedResponse } = cachedPage;
      const isDataInvalid = hash !== hashData(cachedResponse);
      if (!storageItem || isStale(storageItem) || isDataInvalid) {
        await removeStorageItem(cacheKey);
        return null;
      }
      return cachedResponse;
    }
  } catch (error) {
    // Invalidate cache if error occurs during retrieval
    await removeStorageItem(cacheKey);
  }
};

export const updateCache = async (
  response: object,
  cacheKey: string,
  after: string = DEFAULT_CACHE_PAGE_KEY,
) => {
  try {
    const newCachedPage: CachedPage = {
      cachedResponse: response,
      hash: hashData(response),
    };

    const existing = await getStorageItem<BridgeCacheStorage>(cacheKey);
    const storageItem: BridgeCacheStorage = {
      ...(existing ?? {}),
      timestamp:
        typeof existing?.timestamp === 'number'
          ? existing.timestamp
          : Date.now(),
      [after]: newCachedPage,
    };

    await setStorageItem(cacheKey, storageItem);
  } catch (error) {
    // Invalidate cache if update fails
    await removeStorageItem(cacheKey);
  }
};

/**
 * This function is called when the bridge page is unloaded or reset.
 * It removes all bridge cache items that are either stale or are search results.
 */
export const clearAllBridgeCacheItems = async () => {
  const cacheKeys = await getStorageKeysWithPrefix(BRIDGE_CACHE_PREFIX);
  await Promise.allSettled(
    cacheKeys.map(async (key) => {
      const cachedItem = await getStorageItem<BridgeCacheStorage>(key);
      if (cachedItem && (isStale(cachedItem) || key.includes('search'))) {
        await removeStorageItem(key);
      }
    }),
  );
};
