import { Hex } from '@metamask/utils';
import { hexToDecimal } from '../../../../shared/lib/conversion.utils';
import {
  getSentinelNetworkFlags,
  getSendBundleSupportedChains,
  isSendBundleSupported,
  setSentinelApiAuth,
} from './sentinel-api';
import { resetSentinelApiService } from './sentinel-api-service';

jest.mock('../../../../shared/lib/conversion.utils');

const NETWORK_ETHEREUM_MOCK = 'ethereum-mainnet';

const MAINNET_BASE = {
  network: NETWORK_ETHEREUM_MOCK,
  confirmations: true,
  smartTransactions: true,
  relayTransactions: true,
  sendBundle: true,
} as const;

const POLYGON_BASE = {
  network: 'polygon-mainnet',
  confirmations: true,
  smartTransactions: false,
  relayTransactions: false,
  sendBundle: false,
} as const;

const MOCK_NETWORKS = {
  '1': { ...MAINNET_BASE },
  '137': { ...POLYGON_BASE },
};

/**
 * Builds a mock `Response` resolving to the given JSON body.
 *
 * @param json - The JSON body the response resolves to.
 * @param ok - Whether the response is a 2xx response. Defaults to true.
 * @returns The mock response.
 */
function mockResponse(json: unknown, ok = true): Response {
  return {
    ok,
    status: ok ? 200 : 500,
    json: async () => json,
    text: async () => JSON.stringify(json),
  } as Response;
}

const fetchMock = jest.fn<Promise<Response>, [string, RequestInit?]>();

describe('sentinel-api', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    resetSentinelApiService();
    setSentinelApiAuth(undefined);
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    (hexToDecimal as jest.Mock).mockImplementation((hex: string) => {
      if (hex === '0x1') {
        return '1';
      }
      if (hex === '0x89') {
        return '137';
      }
      return '12345';
    });
  });

  describe('setSentinelApiAuth', () => {
    it('includes Authorization header on requests when a token getter is set', async () => {
      setSentinelApiAuth(async () => 'test-token');
      fetchMock.mockResolvedValueOnce(mockResponse(MOCK_NETWORKS));

      await getSentinelNetworkFlags('0x1' as Hex);

      const [, requestInit] = fetchMock.mock.calls[0];
      expect(
        (requestInit?.headers as Record<string, string>).Authorization,
      ).toBe('Bearer test-token');
    });

    it('omits Authorization header when no token getter is set', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse(MOCK_NETWORKS));

      await getSentinelNetworkFlags('0x1' as Hex);

      const [, requestInit] = fetchMock.mock.calls[0];
      expect(
        (requestInit?.headers as Record<string, string>).Authorization,
      ).toBeUndefined();
    });

    it('includes the client identity headers on requests', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse(MOCK_NETWORKS));

      await getSentinelNetworkFlags('0x1' as Hex);

      const [, requestInit] = fetchMock.mock.calls[0];
      expect(
        (requestInit?.headers as Record<string, string>)['X-Client-Id'],
      ).toBe('extension');
    });
  });

  describe('getSentinelNetworkFlags', () => {
    const mainnetHex: Hex = '0x1';
    const polygonHex: Hex = '0x89';

    it('returns network data for provided chainId (Mainnet)', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse(MOCK_NETWORKS));

      const result = await getSentinelNetworkFlags(mainnetHex);
      expect(hexToDecimal).toHaveBeenCalledWith('0x1');
      expect(result).toStrictEqual(MAINNET_BASE);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ headers: expect.any(Object) }),
      );
    });

    it('returns network data for another registered chainId (Polygon)', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse(MOCK_NETWORKS));

      const result = await getSentinelNetworkFlags(polygonHex);
      expect(hexToDecimal).toHaveBeenCalledWith('0x89');
      expect(result).toStrictEqual(POLYGON_BASE);
    });

    it('returns undefined for chainId not in network data', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse(MOCK_NETWORKS));
      (hexToDecimal as jest.Mock).mockReturnValue('99999');
      const result = await getSentinelNetworkFlags('0xFAFA' as Hex);
      expect(result).toBeUndefined();
    });

    it('returns undefined if the networks request throws', async () => {
      fetchMock.mockRejectedValueOnce(new Error('API connection error'));
      await expect(getSentinelNetworkFlags('0x1' as Hex)).resolves.toBe(
        undefined,
      );
    });

    it('returns undefined if the networks response is not ok', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse({}, false));

      await expect(getSentinelNetworkFlags('0x1' as Hex)).resolves.toBe(
        undefined,
      );
    });
  });

  describe('getSendBundleSupportedChains', () => {
    const chainIds: Hex[] = ['0x1', '0x89', '0xFAFA'];

    it('returns a map of chain IDs to sendBundle support status', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse(MOCK_NETWORKS));

      const result = await getSendBundleSupportedChains(chainIds);
      expect(result).toEqual({
        '0x1': true,
        '0x89': false,
        '0xFAFA': false,
      });
    });

    it('returns false for unsupported chains', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse(MOCK_NETWORKS));

      const result = await getSendBundleSupportedChains(['0xFAFA']);
      expect(result).toEqual({ '0xFAFA': false });
    });

    it('returns false for all chains if the networks request throws', async () => {
      fetchMock.mockRejectedValueOnce(new Error('API connection error'));

      const result = await getSendBundleSupportedChains(chainIds);
      expect(result).toEqual({
        '0x1': false,
        '0x89': false,
        '0xFAFA': false,
      });
    });
  });

  describe('isSendBundleSupported', () => {
    const mainnetHex: Hex = '0x1';
    const polygonHex: Hex = '0x89';

    it('returns true if network supports sendBundle', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse(MOCK_NETWORKS));
      const result = await isSendBundleSupported(mainnetHex);
      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('returns false if sendBundle is false', async () => {
      const networksWithFalse = {
        ...MOCK_NETWORKS,
        '1': { ...MAINNET_BASE, sendBundle: false },
      };
      fetchMock.mockResolvedValueOnce(mockResponse(networksWithFalse));
      const result = await isSendBundleSupported(mainnetHex);
      expect(result).toBe(false);
    });

    it('returns false if network is undefined', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse({}));
      const result = await isSendBundleSupported('0xFAFA' as Hex);
      expect(result).toBe(false);
    });

    it('returns false if sendBundle is missing', async () => {
      const networksMissing = {
        ...MOCK_NETWORKS,
        '1': { network: NETWORK_ETHEREUM_MOCK, relayTransactions: true },
      };
      fetchMock.mockResolvedValueOnce(mockResponse(networksMissing));
      const result = await isSendBundleSupported(mainnetHex);
      expect(result).toBe(false);
    });

    it('returns false for another network where sendBundle is false', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse(MOCK_NETWORKS));
      const result = await isSendBundleSupported(polygonHex);
      expect(result).toBe(false);
    });

    it('returns false if the fetch fails', async () => {
      fetchMock.mockRejectedValueOnce(new Error('API error!'));
      await expect(isSendBundleSupported(mainnetHex)).resolves.toBe(false);
    });

    it('returns false if response json parsing fails', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as unknown as Response);

      await expect(isSendBundleSupported(mainnetHex)).resolves.toBe(false);
    });
  });
});
