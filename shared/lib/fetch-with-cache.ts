import { MINUTE, SECOND } from '../constants/time';
import getFetchWithTimeout from '../modules/fetch-with-timeout';
import { getStorageItem, setStorageItem } from './storage-helpers';

type CacheEntry<T = unknown> = {
  cachedResponse: T;
  cachedTime: number;
};

const fetchWithCache = async <T = unknown>({
  url,
  fetchOptions = {},
  cacheOptions: { cacheRefreshTime = MINUTE * 6, timeout = SECOND * 30 } = {},
  functionName = '',
  allowStale = false,
  cacheKey = `cachedFetch:${url}`,
}: {
  url: string;

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchOptions?: RequestInit;

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cacheOptions?: Record<string, any>;
  functionName: string;
  allowStale?: boolean;
  cacheKey?: string;
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
  const storedItem = await getStorageItem<CacheEntry<T>>(cacheKey);
  let cachedResponse: CacheEntry<T>['cachedResponse'] | undefined;
  if (storedItem) {
    let cachedTime: CacheEntry<T>['cachedTime'];
    ({ cachedResponse, cachedTime } = storedItem);
    if (currentTime - cachedTime < cacheRefreshTime) {
      return cachedResponse;
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
      return cachedResponse;
    }
    throw new Error(
      `Fetch with cache failed within function ${functionName} with status'${response.status}': '${response.statusText}'`,
    );
  }
  const responseJson =
    response.status === 204 ? undefined : ((await response.json()) as T);
  const cacheEntry = {
    cachedResponse: responseJson,
    cachedTime: currentTime,
  };

  await setStorageItem(cacheKey, cacheEntry);
  return responseJson;
};

export default fetchWithCache;
