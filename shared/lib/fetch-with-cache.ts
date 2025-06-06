import { MINUTE, SECOND } from '../constants/time';
import getFetchWithTimeout from '../modules/fetch-with-timeout';
import { Cloneable, getStorageItem, setStorageItem } from './storage-helpers';

type CacheEntry = {
  cachedResponse: Cloneable;
  cachedTime: number;
};

const fetchWithCache = async ({
  url,
  fetchOptions = {},
  cacheOptions: { cacheRefreshTime = MINUTE * 6, timeout = SECOND * 30 } = {},
  functionName = '',
  allowStale = false,
}: {
  url: string;

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchOptions?: Record<string, any>;

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cacheOptions?: Record<string, any>;
  functionName: string;
  allowStale?: boolean;
}) => {
  if (
    fetchOptions.body ||
    (fetchOptions.method && fetchOptions.method !== 'GET')
  ) {
    throw new Error('fetchWithCache only supports GET requests');
  }
  if (!(fetchOptions.headers instanceof window.Headers)) {
    fetchOptions.headers = new window.Headers(fetchOptions.headers);
  }
  if (
    fetchOptions.headers.has('Content-Type') &&
    fetchOptions.headers.get('Content-Type') !== 'application/json'
  ) {
    throw new Error('fetchWithCache only supports JSON responses');
  }

  const currentTime = Date.now();
  const cacheKey = `cachedFetch:${url}`;
  const cached = await getStorageItem<CacheEntry>(cacheKey);
  if (cached) {
    if (currentTime - cached.cachedTime < cacheRefreshTime) {
      return cached.cachedResponse;
    }
  }
  fetchOptions.headers.set('Content-Type', 'application/json');
  const fetchWithTimeout = getFetchWithTimeout(timeout);
  const response = await fetchWithTimeout(url, {
    referrerPolicy: 'no-referrer-when-downgrade',
    body: null,
    method: 'GET',
    mode: 'cors',
    ...fetchOptions,
  });
  if (!response.ok) {
    const message = `Fetch with cache failed within function ${functionName} with status'${response.status}': '${response.statusText}'`;
    if (allowStale) {
      console.debug(`${message}. Returning cached result`);
      return cached?.cachedResponse;
    }
    throw new Error(
      `Fetch with cache failed within function ${functionName} with status'${response.status}': '${response.statusText}'`,
    );
  }
  const responseBytes =
    response.status === 204 ? undefined : await response.bytes();
  const cacheEntry: CacheEntry = {
    cachedResponse: responseBytes,
    cachedTime: currentTime,
  };

  // fire and forget, no need to wait for the cache to be written
  setStorageItem(cacheKey, cacheEntry);

  // @ts-expect-error typescript's `JSON.parse` type is wrong; it does allow parsing of `Uint8Array` directly
  return responseBytes ?? JSON.parse(responseBytes);
};

export default fetchWithCache;
