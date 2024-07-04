import fetchWithCache from '../../../shared/lib/fetch-with-cache';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { fetchBridgeFeatureFlags, fetchBridgeTokens } from './bridge.util';

jest.mock('../../../shared/lib/fetch-with-cache');

describe('Bridge utils', () => {
  describe('fetchBridgeFeatureFlags', () => {
    it('should fetch bridge feature flags successfully', async () => {
      const mockResponse = {
        'extension-support': true,
        'src-network-allowlist': [1, 10, 59144, 120],
        'dest-network-allowlist': [1, 137, 59144, 11111],
      };

      (fetchWithCache as jest.Mock).mockResolvedValue(mockResponse);

      const result = await fetchBridgeFeatureFlags();

      expect(fetchWithCache).toHaveBeenCalledWith({
        url: 'https://bridge.api.cx.metamask.io/getAllFeatureFlags',
        fetchOptions: {
          method: 'GET',
          headers: { 'X-Client-Id': 'extension' },
        },
        cacheOptions: { cacheRefreshTime: 600000 },
        functionName: 'fetchBridgeFeatureFlags',
      });

      expect(result).toStrictEqual({
        extensionSupport: true,
        srcNetworkAllowlist: [
          CHAIN_IDS.MAINNET,
          CHAIN_IDS.OPTIMISM,
          CHAIN_IDS.LINEA_MAINNET,
          '0x78',
        ],
        destNetworkAllowlist: [
          CHAIN_IDS.MAINNET,
          CHAIN_IDS.POLYGON,
          CHAIN_IDS.LINEA_MAINNET,
          '0x2b67',
        ],
      });
    });

    it('should use fallback bridge feature flags if response is unexpected', async () => {
      const mockResponse = {
        flag1: true,
        flag2: false,
      };

      (fetchWithCache as jest.Mock).mockResolvedValue(mockResponse);

      const result = await fetchBridgeFeatureFlags();

      expect(fetchWithCache).toHaveBeenCalledWith({
        url: 'https://bridge.api.cx.metamask.io/getAllFeatureFlags',
        fetchOptions: {
          method: 'GET',
          headers: { 'X-Client-Id': 'extension' },
        },
        cacheOptions: { cacheRefreshTime: 600000 },
        functionName: 'fetchBridgeFeatureFlags',
      });

      expect(result).toStrictEqual({
        extensionSupport: false,
        srcNetworkAllowlist: [],
        destNetworkAllowlist: [],
      });
    });

    it('should handle fetch error', async () => {
      const mockError = new Error('Failed to fetch');

      (fetchWithCache as jest.Mock).mockRejectedValue(mockError);

      await expect(fetchBridgeFeatureFlags()).rejects.toThrowError(mockError);
    });
  });

  describe('fetchBridgeTokens', () => {
    it('should fetch bridge tokens successfully', async () => {
      const mockResponse = [
        {
          address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
          symbol: 'ABC',
          decimals: 16,
        },
        {
          address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f985',
          decimals: 16,
        },
        {
          address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f986',
          symbol: 'DEF',
        },
        {
          address: '0x124',
          symbol: 'JKL',
          decimals: 16,
        },
      ];

      (fetchWithCache as jest.Mock).mockResolvedValue(mockResponse);

      const result = await fetchBridgeTokens('0xa');

      expect(fetchWithCache).toHaveBeenCalledWith({
        url: 'https://bridge.api.cx.metamask.io/getTokens?chainId=10',
        fetchOptions: {
          method: 'GET',
          headers: { 'X-Client-Id': 'extension' },
        },
        cacheOptions: { cacheRefreshTime: 600000 },
        functionName: 'fetchBridgeTokens',
      });

      expect(result).toStrictEqual({
        '0x0000000000000000000000000000000000000000': {
          address: '0x0000000000000000000000000000000000000000',
          decimals: 18,
          iconUrl: './images/eth_logo.svg',
          name: 'Ether',
          symbol: 'ETH',
        },
        '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984': {
          address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
          decimals: 16,
          symbol: 'ABC',
        },
      });
    });

    it('should handle fetch error', async () => {
      const mockError = new Error('Failed to fetch');

      (fetchWithCache as jest.Mock).mockRejectedValue(mockError);

      await expect(fetchBridgeTokens('0xa')).rejects.toThrowError(mockError);
    });
  });
});
