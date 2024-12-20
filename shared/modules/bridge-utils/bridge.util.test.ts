import { zeroAddress } from 'ethereumjs-util';
import fetchWithCache from '../../lib/fetch-with-cache';
import { CHAIN_IDS } from '../../constants/network';
import mockBridgeQuotesErc20Erc20 from '../../../test/data/bridge/mock-quotes-erc20-erc20.json';
import mockBridgeQuotesNativeErc20 from '../../../test/data/bridge/mock-quotes-native-erc20.json';
import {
  fetchBridgeFeatureFlags,
  fetchBridgeQuotes,
  fetchBridgeTokens,
} from './bridge.util';

jest.mock('../../../shared/lib/fetch-with-cache');

describe('Bridge utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchBridgeFeatureFlags', () => {
    it('should fetch bridge feature flags successfully', async () => {
      const mockResponse = {
        'extension-config': {
          refreshRate: 3,
          maxRefreshCount: 1,
          support: true,
          chains: {
            '1': {
              isActiveSrc: true,
              isActiveDest: true,
            },
            '10': {
              isActiveSrc: true,
              isActiveDest: false,
            },
            '59144': {
              isActiveSrc: true,
              isActiveDest: true,
            },
            '120': {
              isActiveSrc: true,
              isActiveDest: false,
            },
            '137': {
              isActiveSrc: false,
              isActiveDest: true,
            },
            '11111': {
              isActiveSrc: false,
              isActiveDest: true,
            },
          },
        },
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
        extensionConfig: {
          maxRefreshCount: 1,
          refreshRate: 3,
          support: true,
          chains: {
            [CHAIN_IDS.MAINNET]: {
              isActiveSrc: true,
              isActiveDest: true,
            },
            [CHAIN_IDS.OPTIMISM]: {
              isActiveSrc: true,
              isActiveDest: false,
            },
            [CHAIN_IDS.LINEA_MAINNET]: {
              isActiveSrc: true,
              isActiveDest: true,
            },
            '0x78': {
              isActiveSrc: true,
              isActiveDest: false,
            },
            [CHAIN_IDS.POLYGON]: {
              isActiveSrc: false,
              isActiveDest: true,
            },
            '0x2b67': {
              isActiveSrc: false,
              isActiveDest: true,
            },
          },
        },
      });
    });

    it('should use fallback bridge feature flags if response is unexpected', async () => {
      const mockResponse = {
        'extension-config': {
          refreshRate: 3,
          maxRefreshCount: 1,
          support: 25,
          chains: {
            a: {
              isActiveSrc: 1,
              isActiveDest: 'test',
            },
            '2': {
              isActiveSrc: 'test',
              isActiveDest: 2,
            },
          },
        },
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
        extensionConfig: {
          maxRefreshCount: 5,
          refreshRate: 30000,
          support: false,
          chains: {},
        },
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
          decimals: 16,
          symbol: 'DEF',
          aggregators: ['lifi'],
        },
        {
          address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f987',
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
        '0x1f9840a85d5af5bf1d1762f925bdaddc4201f986': {
          address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f986',
          decimals: 16,
          symbol: 'DEF',
          aggregators: ['lifi'],
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

  describe('fetchBridgeQuotes', () => {
    it('should fetch bridge quotes successfully, no approvals', async () => {
      (fetchWithCache as jest.Mock).mockResolvedValue(
        mockBridgeQuotesNativeErc20,
      );
      const { signal } = new AbortController();

      const result = await fetchBridgeQuotes(
        {
          walletAddress: '0x123',
          srcChainId: 1,
          destChainId: 10,
          srcTokenAddress: zeroAddress(),
          destTokenAddress: zeroAddress(),
          srcTokenAmount: '20000',
          slippage: 0.5,
        },
        signal,
      );

      expect(fetchWithCache).toHaveBeenCalledWith({
        url: 'https://bridge.api.cx.metamask.io/getQuote?walletAddress=0x123&srcChainId=1&destChainId=10&srcTokenAddress=0x0000000000000000000000000000000000000000&destTokenAddress=0x0000000000000000000000000000000000000000&srcTokenAmount=20000&slippage=0.5&insufficientBal=false&resetApproval=false',
        fetchOptions: {
          method: 'GET',
          headers: { 'X-Client-Id': 'extension' },
          signal,
        },
        cacheOptions: { cacheRefreshTime: 0 },
        functionName: 'fetchBridgeQuotes',
      });

      expect(result).toStrictEqual(mockBridgeQuotesNativeErc20);
    });

    it('should fetch bridge quotes successfully, with approvals', async () => {
      (fetchWithCache as jest.Mock).mockResolvedValue([
        ...mockBridgeQuotesErc20Erc20,
        { ...mockBridgeQuotesErc20Erc20[0], approval: null },
        { ...mockBridgeQuotesErc20Erc20[0], trade: null },
      ]);
      const { signal } = new AbortController();

      const result = await fetchBridgeQuotes(
        {
          walletAddress: '0x123',
          srcChainId: 1,
          destChainId: 10,
          srcTokenAddress: zeroAddress(),
          destTokenAddress: zeroAddress(),
          srcTokenAmount: '20000',
          slippage: 0.5,
        },
        signal,
      );

      expect(fetchWithCache).toHaveBeenCalledWith({
        url: 'https://bridge.api.cx.metamask.io/getQuote?walletAddress=0x123&srcChainId=1&destChainId=10&srcTokenAddress=0x0000000000000000000000000000000000000000&destTokenAddress=0x0000000000000000000000000000000000000000&srcTokenAmount=20000&slippage=0.5&insufficientBal=false&resetApproval=false',
        fetchOptions: {
          method: 'GET',
          headers: { 'X-Client-Id': 'extension' },
          signal,
        },
        cacheOptions: { cacheRefreshTime: 0 },
        functionName: 'fetchBridgeQuotes',
      });

      expect(result).toStrictEqual(mockBridgeQuotesErc20Erc20);
    });

    it('should filter out malformed bridge quotes', async () => {
      (fetchWithCache as jest.Mock).mockResolvedValue([
        ...mockBridgeQuotesErc20Erc20,
        ...mockBridgeQuotesErc20Erc20.map(
          ({ quote, ...restOfQuote }) => restOfQuote,
        ),
        {
          ...mockBridgeQuotesErc20Erc20[0],
          quote: {
            srcAsset: {
              ...mockBridgeQuotesErc20Erc20[0].quote.srcAsset,
              decimals: undefined,
            },
          },
        },
        {
          ...mockBridgeQuotesErc20Erc20[1],
          quote: {
            srcAsset: {
              ...mockBridgeQuotesErc20Erc20[1].quote.destAsset,
              address: undefined,
            },
          },
        },
      ]);
      const { signal } = new AbortController();

      const result = await fetchBridgeQuotes(
        {
          walletAddress: '0x123',
          srcChainId: 1,
          destChainId: 10,
          srcTokenAddress: zeroAddress(),
          destTokenAddress: zeroAddress(),
          srcTokenAmount: '20000',
          slippage: 0.5,
        },
        signal,
      );

      expect(fetchWithCache).toHaveBeenCalledWith({
        url: 'https://bridge.api.cx.metamask.io/getQuote?walletAddress=0x123&srcChainId=1&destChainId=10&srcTokenAddress=0x0000000000000000000000000000000000000000&destTokenAddress=0x0000000000000000000000000000000000000000&srcTokenAmount=20000&slippage=0.5&insufficientBal=false&resetApproval=false',
        fetchOptions: {
          method: 'GET',
          headers: { 'X-Client-Id': 'extension' },
          signal,
        },
        cacheOptions: { cacheRefreshTime: 0 },
        functionName: 'fetchBridgeQuotes',
      });

      expect(result).toStrictEqual(mockBridgeQuotesErc20Erc20);
    });
  });
});
