import { memoize } from 'lodash';
import { SECOND } from '../constants/time';

/**
 * Returns a function that can be used to make an HTTP request but timing out
 * automatically after a desired amount of time.
 *
 * @param timeout - The number of milliseconds to wait until the request times
 * out.
 * @returns A function that, when called, returns a promise that either resolves
 * to the HTTP response object or is rejected if a network error is encountered
 * or the request times out.
 */
const getFetchWithTimeout = memoize((timeout = SECOND * 30) => {
  if (!Number.isInteger(timeout) || timeout < 1) {
    throw new Error('Must specify positive integer timeout.');
  }

  return async function fetchWithTimeout(
    url: RequestInfo,
    opts?: RequestInit,
  ): Promise<Response> {
    const abortController = new window.AbortController();

    // Add the provided signal to the list of signals that can abort the request
    const abortSignals = [abortController.signal];
    if (opts?.signal) {
      abortSignals.push(opts.signal);
    }

    const combinedAbortController = new AbortController();
    const abortHandler = () => combinedAbortController.abort();
    abortSignals.forEach((sig) => sig.addEventListener('abort', abortHandler));

    const f = window.fetch(url, {
      ...opts,
      signal: combinedAbortController.signal,
    });

    const timer = setTimeout(() => abortController.abort(), timeout);

    try {
      return await f;
    } finally {
      clearTimeout(timer);
      abortSignals.forEach((sig) =>
        sig.removeEventListener('abort', abortHandler),
      );
    }
  };
});

export default getFetchWithTimeout;
