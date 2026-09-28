import getFetchWithTimeout from '../../../shared/lib/fetch-with-timeout';
import { PREINSTALLED_SNAPS_URLS } from '../constants/snaps';

/**
 * Loads the preinstalled snaps from urls and returns them as an array.
 * It fails if any Snap fails to load in the expected time range.
 * Supports .json.gz files using gzip decompression.
 */
export async function loadPreinstalledSnaps(): Promise<unknown[]> {
  const fetchWithTimeout = getFetchWithTimeout();
  const promises = PREINSTALLED_SNAPS_URLS.map(async (url) => {
    const response = await fetchWithTimeout(url.href);

    // If the Snap is compressed, decompress it
    if (url.pathname.endsWith('.json.gz')) {
      const ds = new DecompressionStream('gzip');
      const { body } = response;
      if (body === null) {
        throw new TypeError('Response body is null');
      }
      const decompressedStream = body.pipeThrough(ds);
      return await new Response(decompressedStream).json();
    }

    return await response.json();
  });

  return Promise.all(promises);
}
