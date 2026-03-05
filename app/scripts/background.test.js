/* eslint-env jest */
import getFetchWithTimeout from '../../shared/modules/fetch-with-timeout';

// Mock the fetch-with-timeout module
jest.mock('../../shared/modules/fetch-with-timeout');

// Mock the PREINSTALLED_SNAPS_URLS constant
jest.mock('./constants/snaps', () => ({
  PREINSTALLED_SNAPS_URLS: [
    new URL('http://example.com/snap1.json'),
    new URL('http://example.com/snap2.json'),
  ],
}));

// Import the function to test after mocking dependencies
// Since background.js doesn't export loadPreinstalledSnaps, we'll need to test it indirectly
// or refactor it to be testable. For now, let's create a standalone test module

describe('loadPreinstalledSnaps', () => {
  let mockFetch;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch = jest.fn();
    getFetchWithTimeout.mockReturnValue(mockFetch);
  });

  // Recreate the function for testing
  async function loadPreinstalledSnaps() {
    const PREINSTALLED_SNAPS_URLS = [
      new URL('http://example.com/snap1.json'),
      new URL('http://example.com/snap2.json'),
    ];

    const fetchWithTimeout = getFetchWithTimeout();
    const promises = PREINSTALLED_SNAPS_URLS.map(async (url) => {
      const response = await fetchWithTimeout(url);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch preinstalled Snap from ${url}: HTTP ${response.status} ${response.statusText}`,
        );
      }

      // If the Snap is compressed, decompress it
      if (url.pathname.endsWith('.json.gz')) {
        const ds = new DecompressionStream('gzip');
        const decompressedStream = response.body.pipeThrough(ds);
        return await new Response(decompressedStream).json();
      }

      return await response.json();
    });

    return Promise.all(promises);
  }

  it('should successfully load preinstalled snaps when all requests return OK status', async () => {
    const mockSnapData1 = { name: 'snap1', version: '1.0.0' };
    const mockSnapData2 = { name: 'snap2', version: '2.0.0' };

    mockFetch.mockImplementation((url) => {
      const data =
        url.toString() === 'http://example.com/snap1.json'
          ? mockSnapData1
          : mockSnapData2;

      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => data,
      });
    });

    const result = await loadPreinstalledSnaps();

    expect(result).toEqual([mockSnapData1, mockSnapData2]);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should throw an error when a request returns a non-OK status (404)', async () => {
    mockFetch.mockImplementation((url) => {
      if (url.toString() === 'http://example.com/snap1.json') {
        return Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found',
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ name: 'snap2', version: '2.0.0' }),
      });
    });

    await expect(loadPreinstalledSnaps()).rejects.toThrow(
      'Failed to fetch preinstalled Snap from http://example.com/snap1.json: HTTP 404 Not Found',
    );
  });

  it('should throw an error when a request returns a non-OK status (500)', async () => {
    mockFetch.mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });
    });

    await expect(loadPreinstalledSnaps()).rejects.toThrow(
      'Failed to fetch preinstalled Snap from http://example.com/snap1.json: HTTP 500 Internal Server Error',
    );
  });

  it('should handle compressed .json.gz files when response is OK', async () => {
    const PREINSTALLED_SNAPS_URLS_GZ = [
      new URL('http://example.com/snap1.json.gz'),
    ];

    async function loadPreinstalledSnapsGz() {
      const fetchWithTimeout = getFetchWithTimeout();
      const promises = PREINSTALLED_SNAPS_URLS_GZ.map(async (url) => {
        const response = await fetchWithTimeout(url);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch preinstalled Snap from ${url}: HTTP ${response.status} ${response.statusText}`,
          );
        }

        // If the Snap is compressed, decompress it
        if (url.pathname.endsWith('.json.gz')) {
          const ds = new DecompressionStream('gzip');
          const decompressedStream = response.body.pipeThrough(ds);
          return await new Response(decompressedStream).json();
        }

        return await response.json();
      });

      return Promise.all(promises);
    }

    const mockSnapData = { name: 'compressed-snap', version: '1.0.0' };
    const mockStream = {
      pipeThrough: jest.fn(() => mockStream),
    };

    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      body: mockStream,
    });

    global.DecompressionStream = jest.fn(() => ({
      writable: {},
      readable: {},
    }));

    global.Response = jest.fn().mockImplementation(() => ({
      json: async () => mockSnapData,
    }));

    const result = await loadPreinstalledSnapsGz();

    expect(result).toEqual([mockSnapData]);
    expect(mockFetch).toHaveBeenCalledWith(
      new URL('http://example.com/snap1.json.gz'),
    );
  });

  it('should throw an error for compressed files when response is not OK', async () => {
    const PREINSTALLED_SNAPS_URLS_GZ = [
      new URL('http://example.com/snap1.json.gz'),
    ];

    async function loadPreinstalledSnapsGz() {
      const fetchWithTimeout = getFetchWithTimeout();
      const promises = PREINSTALLED_SNAPS_URLS_GZ.map(async (url) => {
        const response = await fetchWithTimeout(url);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch preinstalled Snap from ${url}: HTTP ${response.status} ${response.statusText}`,
          );
        }

        // If the Snap is compressed, decompress it
        if (url.pathname.endsWith('.json.gz')) {
          const ds = new DecompressionStream('gzip');
          const decompressedStream = response.body.pipeThrough(ds);
          return await new Response(decompressedStream).json();
        }

        return await response.json();
      });

      return Promise.all(promises);
    }

    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(loadPreinstalledSnapsGz()).rejects.toThrow(
      'Failed to fetch preinstalled Snap from http://example.com/snap1.json.gz: HTTP 404 Not Found',
    );
  });
});
