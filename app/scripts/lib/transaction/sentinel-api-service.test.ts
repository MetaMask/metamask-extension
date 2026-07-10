import {
  getSentinelApiService,
  resetSentinelApiService,
  setSentinelApiAuth,
} from './sentinel-api-service';
import { SentinelApiService } from '@metamask/sentinel-api-service';

const NETWORKS_MOCK = {
  1: {
    relayTransactions: true,
    network: 'test',
  },
};

/**
 * Builds a mock `Response` resolving to the given JSON body.
 *
 * @param json - The JSON body the response resolves to.
 * @returns The mock response.
 */
function mockResponse(json: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: async () => json,
    text: async () => JSON.stringify(json),
  } as Response;
}

const fetchMock = jest.fn<Promise<Response>, [string, RequestInit?]>();

describe('sentinel-api-service', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    resetSentinelApiService();
    setSentinelApiAuth(undefined);
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    resetSentinelApiService();
  });

  describe('getSentinelApiService', () => {
    it('returns a SentinelApiService instance', () => {
      expect(getSentinelApiService()).toBeInstanceOf(SentinelApiService);
    });

    it('returns the same instance on subsequent calls', () => {
      expect(getSentinelApiService()).toBe(getSentinelApiService());
    });

    it('constructs a new instance after reset', () => {
      const first = getSentinelApiService();
      resetSentinelApiService();
      expect(getSentinelApiService()).not.toBe(first);
    });

    it('sends the extension client identity header', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse(NETWORKS_MOCK));

      await getSentinelApiService().getNetworks();

      const [, requestInit] = fetchMock.mock.calls[0];
      expect(
        (requestInit?.headers as Record<string, string>)['X-Client-Id'],
      ).toBe('extension');
    });
  });

  describe('setSentinelApiAuth', () => {
    it('adds an Authorization header when a token getter is set', async () => {
      setSentinelApiAuth(async () => 'my-token');
      fetchMock.mockResolvedValueOnce(mockResponse(NETWORKS_MOCK));

      await getSentinelApiService().getNetworks();

      const [, requestInit] = fetchMock.mock.calls[0];
      expect(
        (requestInit?.headers as Record<string, string>).Authorization,
      ).toBe('Bearer my-token');
    });

    it('omits the Authorization header when the getter returns undefined', async () => {
      setSentinelApiAuth(async () => undefined);
      fetchMock.mockResolvedValueOnce(mockResponse(NETWORKS_MOCK));

      await getSentinelApiService().getNetworks();

      const [, requestInit] = fetchMock.mock.calls[0];
      expect(
        (requestInit?.headers as Record<string, string>).Authorization,
      ).toBeUndefined();
    });

    it('omits the Authorization header when the getter throws', async () => {
      setSentinelApiAuth(async () => {
        throw new Error('token error');
      });
      fetchMock.mockResolvedValueOnce(mockResponse(NETWORKS_MOCK));

      await getSentinelApiService().getNetworks();

      const [, requestInit] = fetchMock.mock.calls[0];
      expect(
        (requestInit?.headers as Record<string, string>).Authorization,
      ).toBeUndefined();
    });

    it('clears the token getter when passed undefined', async () => {
      setSentinelApiAuth(async () => 'my-token');
      setSentinelApiAuth(undefined);
      fetchMock.mockResolvedValueOnce(mockResponse(NETWORKS_MOCK));

      await getSentinelApiService().getNetworks();

      const [, requestInit] = fetchMock.mock.calls[0];
      expect(
        (requestInit?.headers as Record<string, string>).Authorization,
      ).toBeUndefined();
    });
  });

  describe('resetSentinelApiService', () => {
    it('does not throw when no service has been constructed', () => {
      expect(() => resetSentinelApiService()).not.toThrow();
    });
  });
});
