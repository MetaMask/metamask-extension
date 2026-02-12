import { CacheEntry } from './BaseDataService';

export async function withRetry<ResultType>(
  fn: () => Promise<ResultType>,
  retries: number,
) {
  let attempt = 0;

  while (attempt <= retries) {
    try {
      return await fn();
    } catch (error) {
      if (attempt < retries) {
        attempt += 1;
        continue;
      }
      throw error;
    }
  }
}

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export function isCacheExpired(
  entry: WithRequired<CacheEntry, 'dataUpdated'>,
  cacheTime: number,
) {
  const now = Date.now();
  return now - entry.dataUpdated > cacheTime;
}
