import { loadPreinstalledSnaps } from './load-preinstalled-snaps';

const mockFetchWithTimeout = jest.fn();

jest.mock('../../../shared/lib/fetch-with-timeout', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Jest ESM interop
  __esModule: true,
  default: () => mockFetchWithTimeout,
}));

jest.mock('../constants/snaps', () => ({
  PREINSTALLED_SNAPS_URLS: [
    new URL('https://example.test/plain.json'),
    new URL('https://example.test/compressed.json.gz'),
  ],
}));

const DECOMPRESSED_SNAP = { id: 'gzip-snap' };

describe('loadPreinstalledSnaps', () => {
  const originalResponse = globalThis.Response;
  const originalDecompressionStream = globalThis.DecompressionStream;
  const pipedStream = {} as ReadableStream;
  let pipeThrough: jest.Mock;

  beforeEach(() => {
    pipeThrough = jest.fn().mockReturnValue(pipedStream);

    globalThis.DecompressionStream = class {
      format: string;

      constructor(format: string) {
        this.format = format;
      }
    } as unknown as typeof DecompressionStream;

    globalThis.Response = class {
      body: unknown;

      constructor(body: unknown) {
        this.body = body;
      }

      json() {
        return Promise.resolve(DECOMPRESSED_SNAP);
      }
    } as unknown as typeof Response;

    mockFetchWithTimeout.mockImplementation(
      async (requestInfo: RequestInfo) => {
        const url = new URL(String(requestInfo));
        if (url.pathname.endsWith('.json.gz')) {
          return {
            body: { pipeThrough },
            json: async () => {
              throw new Error('gzip snaps must not use response.json()');
            },
          };
        }
        return { json: async () => ({ href: url.href }) };
      },
    );
  });

  afterEach(() => {
    globalThis.Response = originalResponse;
    globalThis.DecompressionStream = originalDecompressionStream;
    mockFetchWithTimeout.mockReset();
  });

  it('fetches every preinstalled snap url', async () => {
    const snaps = await loadPreinstalledSnaps();

    expect(mockFetchWithTimeout).toHaveBeenCalledTimes(2);
    expect(snaps).toHaveLength(2);
    expect(snaps[0]).toEqual({ href: 'https://example.test/plain.json' });
  });

  it('decompresses gzipped snap payloads', async () => {
    const snaps = await loadPreinstalledSnaps();

    expect(pipeThrough).toHaveBeenCalledTimes(1);
    expect(pipeThrough.mock.calls[0][0]).toHaveProperty('format', 'gzip');
    expect(snaps[1]).toEqual(DECOMPRESSED_SNAP);
  });
});
