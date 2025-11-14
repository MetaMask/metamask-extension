import { Hex } from '@metamask/utils';
import { fetchAssetMetadata } from '../asset-utils';
import {
  fetchGatorErc20TokenInfo,
  getGatorErc20TokenInfo,
  getGatorPermissionTokenInfo,
  formatGatorAmountLabel,
  getGatorPermissionDisplayMetadata,
  GetTokenStandardAndDetailsByChain,
} from './gator-permissions-utils';

// Mock dependencies
jest.mock('../asset-utils');
jest.mock('loglevel', () => ({
  error: jest.fn(),
}));

const mockFetchAssetMetadata = fetchAssetMetadata as jest.MockedFunction<
  typeof fetchAssetMetadata
>;

describe('gator-permissions-utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchGatorErc20TokenInfo', () => {
    const mockAddress = '0x1234567890123456789012345678901234567890';
    const mockChainId = '0x1' as Hex;

    it('should fetch token info from external services when enabled', async () => {
      mockFetchAssetMetadata.mockResolvedValue({
        symbol: 'TEST',
        decimals: 18,
        image: 'https://example.com/image.png',
        assetId: 'eip155:1/erc20:0x1234567890123456789012345678901234567890',
        address: mockAddress,
        chainId: mockChainId,
      });

      const result = await fetchGatorErc20TokenInfo(
        mockAddress,
        mockChainId,
        true,
      );

      expect(result).toStrictEqual({ symbol: 'TEST', decimals: 18 });
      expect(mockFetchAssetMetadata).toHaveBeenCalledWith(
        mockAddress,
        mockChainId,
      );
    });

    it('should use fallback when external services are disabled', async () => {
      const mockGetTokenDetails: GetTokenStandardAndDetailsByChain = jest
        .fn()
        .mockResolvedValue({
          symbol: 'FALLBACK',
          decimals: 6,
        });

      const result = await fetchGatorErc20TokenInfo(
        mockAddress,
        mockChainId,
        false,
        mockGetTokenDetails,
      );

      expect(result).toStrictEqual({ symbol: 'FALLBACK', decimals: 6 });
      expect(mockGetTokenDetails).toHaveBeenCalledWith(
        mockAddress,
        undefined,
        undefined,
        mockChainId,
      );
    });

    it('should use fallback when external services return incomplete data', async () => {
      mockFetchAssetMetadata.mockResolvedValue(undefined);

      const mockGetTokenDetails: GetTokenStandardAndDetailsByChain = jest
        .fn()
        .mockResolvedValue({
          symbol: 'FALLBACK',
          decimals: 12,
        });

      const result = await fetchGatorErc20TokenInfo(
        mockAddress,
        mockChainId,
        true,
        mockGetTokenDetails,
      );

      expect(result).toStrictEqual({ symbol: 'FALLBACK', decimals: 12 });
    });

    it('should parse decimal as base-10 string when returned as string', async () => {
      mockFetchAssetMetadata.mockResolvedValue(undefined);

      const mockGetTokenDetails: GetTokenStandardAndDetailsByChain = jest
        .fn()
        .mockResolvedValue({
          symbol: 'TOKEN',
          decimals: '18',
        });

      const result = await fetchGatorErc20TokenInfo(
        mockAddress,
        mockChainId,
        true,
        mockGetTokenDetails,
      );

      expect(result).toStrictEqual({ symbol: 'TOKEN', decimals: 18 });
    });

    it('should return default values when no data is available', async () => {
      mockFetchAssetMetadata.mockResolvedValue(undefined);

      const result = await fetchGatorErc20TokenInfo(
        mockAddress,
        mockChainId,
        true,
      );

      expect(result).toStrictEqual({ symbol: 'Unknown Token', decimals: 18 });
    });

    it('should return default values when fallback throws error', async () => {
      mockFetchAssetMetadata.mockResolvedValue(undefined);

      const mockGetTokenDetails: GetTokenStandardAndDetailsByChain = jest
        .fn()
        .mockRejectedValue(new Error('Network error'));

      const result = await fetchGatorErc20TokenInfo(
        mockAddress,
        mockChainId,
        false,
        mockGetTokenDetails,
      );

      expect(result).toStrictEqual({ symbol: 'Unknown Token', decimals: 18 });
    });
  });

  describe('getGatorErc20TokenInfo', () => {
    it('should return cached token info on subsequent calls', async () => {
      const mockAddress = '0x1111111111111111111111111111111111111111';
      const mockChainId = '0x1' as Hex;

      mockFetchAssetMetadata.mockResolvedValue({
        symbol: 'CACHED',
        decimals: 18,
        image: 'https://example.com/image.png',
        assetId: 'eip155:1/erc20:0x1111111111111111111111111111111111111111',
        address: mockAddress,
        chainId: mockChainId,
      });

      const result1 = await getGatorErc20TokenInfo(
        mockAddress,
        mockChainId,
        true,
      );
      const result2 = await getGatorErc20TokenInfo(
        mockAddress,
        mockChainId,
        true,
      );

      expect(result1).toStrictEqual({ symbol: 'CACHED', decimals: 18 });
      expect(result2).toStrictEqual({ symbol: 'CACHED', decimals: 18 });
      // Should only fetch once due to caching
      expect(mockFetchAssetMetadata).toHaveBeenCalledTimes(1);
    });

    it('should cache by chainId and address combination', async () => {
      const mockAddress = '0x2222222222222222222222222222222222222222';
      const mockChainId = '0x1' as Hex;
      const mockChainId2 = '0x89' as Hex;
      mockFetchAssetMetadata
        .mockResolvedValueOnce({
          symbol: 'ETH_TOKEN',
          decimals: 18,
          image: 'https://example.com/image1.png',
          assetId: 'eip155:1/erc20:0x2222222222222222222222222222222222222222',
          address: mockAddress,
          chainId: mockChainId,
        })
        .mockResolvedValueOnce({
          symbol: 'POLY_TOKEN',
          decimals: 6,
          image: 'https://example.com/image2.png',
          assetId:
            'eip155:137/erc20:0x2222222222222222222222222222222222222222',
          address: mockAddress,
          chainId: mockChainId2,
        });

      const result1 = await getGatorErc20TokenInfo(
        mockAddress,
        mockChainId,
        true,
      );
      const result2 = await getGatorErc20TokenInfo(
        mockAddress,
        mockChainId2,
        true,
      );

      expect(result1).toStrictEqual({ symbol: 'ETH_TOKEN', decimals: 18 });
      expect(result2).toStrictEqual({ symbol: 'POLY_TOKEN', decimals: 6 });
      expect(mockFetchAssetMetadata).toHaveBeenCalledTimes(2);
    });

    it('should handle case-insensitive address caching', async () => {
      const mockAddress = '0x3333333333333333333333333333333333333333';
      const mockChainId = '0x1' as Hex;
      const upperCaseAddress = mockAddress.toUpperCase();
      mockFetchAssetMetadata.mockResolvedValue({
        symbol: 'CASE_TEST',
        decimals: 18,
        image: 'https://example.com/image.png',
        assetId: 'eip155:1/erc20:0x3333333333333333333333333333333333333333',
        address: mockAddress,
        chainId: mockChainId,
      });

      const result1 = await getGatorErc20TokenInfo(
        mockAddress.toLowerCase(),
        mockChainId,
        true,
      );
      const result2 = await getGatorErc20TokenInfo(
        upperCaseAddress,
        mockChainId,
        true,
      );

      expect(result1).toStrictEqual({ symbol: 'CASE_TEST', decimals: 18 });
      expect(result2).toStrictEqual({ symbol: 'CASE_TEST', decimals: 18 });
      // Should only fetch once due to case-insensitive caching
      expect(mockFetchAssetMetadata).toHaveBeenCalledTimes(1);
    });

    it('should dedupe in-flight requests', async () => {
      const mockAddress = '0x4444444444444444444444444444444444444444';
      const mockChainId = '0x1' as Hex;
      mockFetchAssetMetadata.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  symbol: 'DEDUPED',
                  decimals: 18,
                  image: 'https://example.com/image.png',
                  assetId:
                    'eip155:1/erc20:0x4444444444444444444444444444444444444444',
                  address: mockAddress,
                  chainId: mockChainId,
                }),
              100,
            ),
          ),
      );

      // Call multiple times before first resolves
      const promise1 = getGatorErc20TokenInfo(mockAddress, mockChainId, true);
      const promise2 = getGatorErc20TokenInfo(mockAddress, mockChainId, true);
      const promise3 = getGatorErc20TokenInfo(mockAddress, mockChainId, true);

      const [result1, result2, result3] = await Promise.all([
        promise1,
        promise2,
        promise3,
      ]);

      expect(result1).toStrictEqual({ symbol: 'DEDUPED', decimals: 18 });
      expect(result2).toStrictEqual({ symbol: 'DEDUPED', decimals: 18 });
      expect(result3).toStrictEqual({ symbol: 'DEDUPED', decimals: 18 });
      // Should only fetch once even with multiple simultaneous calls
      expect(mockFetchAssetMetadata).toHaveBeenCalledTimes(1);
    });
  });

  describe('getGatorPermissionTokenInfo', () => {
    const mockChainId = '0x1';

    it('should return native token info for native-token permission type', async () => {
      const result = await getGatorPermissionTokenInfo({
        permissionType: 'native-token-stream',
        chainId: mockChainId,
        networkConfig: { nativeCurrency: 'ETH' },
        allowExternalServices: true,
      });

      expect(result).toStrictEqual({ symbol: 'ETH', decimals: 18 });
    });

    it('should use networkConfig nativeCurrency for native token', async () => {
      const result = await getGatorPermissionTokenInfo({
        permissionType: 'native-token-periodic',
        chainId: mockChainId,
        networkConfig: { nativeCurrency: 'MATIC' },
        allowExternalServices: true,
      });

      expect(result).toStrictEqual({ symbol: 'MATIC', decimals: 18 });
    });

    it('should fall back to CHAIN_ID_TO_CURRENCY_SYMBOL_MAP for native token', async () => {
      const result = await getGatorPermissionTokenInfo({
        permissionType: 'native-token-stream',
        chainId: mockChainId,
        networkConfig: null,
        allowExternalServices: true,
      });

      expect(result).toStrictEqual({ symbol: 'ETH', decimals: 18 });
    });

    it('should fetch ERC20 token info for erc20-token permission type', async () => {
      const mockTokenAddress = '0x5555555555555555555555555555555555555555';
      mockFetchAssetMetadata.mockResolvedValue({
        symbol: 'USDC',
        decimals: 6,
        image: 'https://example.com/image.png',
        assetId: 'eip155:1/erc20:0x5555555555555555555555555555555555555555',
        address: mockTokenAddress,
        chainId: mockChainId as Hex,
      });

      const result = await getGatorPermissionTokenInfo({
        permissionType: 'erc20-token-stream',
        chainId: mockChainId,
        permissionData: { tokenAddress: mockTokenAddress },
        allowExternalServices: true,
      });

      expect(result).toStrictEqual({ symbol: 'USDC', decimals: 6 });
    });

    it('should return Unknown Token when tokenAddress is missing', async () => {
      const result = await getGatorPermissionTokenInfo({
        permissionType: 'erc20-token-periodic',
        chainId: mockChainId,
        permissionData: {},
        allowExternalServices: true,
      });

      expect(result).toStrictEqual({ symbol: 'Unknown Token', decimals: 18 });
    });

    it('should pass getTokenStandardAndDetailsByChain to token fetcher', async () => {
      const mockTokenAddress = '0x6666666666666666666666666666666666666666';
      mockFetchAssetMetadata.mockResolvedValue(undefined);

      const mockGetTokenDetails: GetTokenStandardAndDetailsByChain = jest
        .fn()
        .mockResolvedValue({
          symbol: 'CUSTOM',
          decimals: 12,
        });

      const result = await getGatorPermissionTokenInfo({
        permissionType: 'erc20-token-stream',
        chainId: mockChainId,
        permissionData: { tokenAddress: mockTokenAddress },
        allowExternalServices: false,
        getTokenStandardAndDetailsByChain: mockGetTokenDetails,
      });

      expect(result).toStrictEqual({ symbol: 'CUSTOM', decimals: 12 });
      expect(mockGetTokenDetails).toHaveBeenCalled();
    });
  });

  describe('formatGatorAmountLabel', () => {
    const defaultParams = {
      tokenSymbol: 'ETH',
      frequency: 'per second',
      tokenDecimals: 18,
      locale: 'en-US',
    };

    it('should format hex amount correctly', () => {
      const result = formatGatorAmountLabel({
        ...defaultParams,
        amount: '0xde0b6b3a7640000', // 1 ETH in wei
      });

      expect(result).toBe('1 ETH per second');
    });

    it('should format decimal string amount correctly', () => {
      const result = formatGatorAmountLabel({
        ...defaultParams,
        amount: '1.5',
      });

      expect(result).toBe('1.5 ETH per second');
    });

    it('should format large hex amounts correctly', () => {
      const result = formatGatorAmountLabel({
        ...defaultParams,
        amount: '0x1bc16d674ec80000', // 2 ETH in wei
      });

      expect(result).toBe('2 ETH per second');
    });

    it('should show threshold for amounts below threshold', () => {
      const result = formatGatorAmountLabel({
        ...defaultParams,
        amount: '0x1', // Very small amount in wei
        threshold: 0.00001,
      });

      expect(result).toBe('<0.00001 ETH per second');
    });

    it('should respect custom number format options', () => {
      const result = formatGatorAmountLabel({
        ...defaultParams,
        amount: '1.123456789',
        numberFormatOptions: {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        },
      });

      expect(result).toBe('1.12 ETH per second');
    });

    it('should handle zero amount as unavailable', () => {
      const result = formatGatorAmountLabel({
        ...defaultParams,
        amount: '0',
      });

      expect(result).toBe('Permission details unavailable');
    });

    it('should handle 0x0 amount as unavailable', () => {
      const result = formatGatorAmountLabel({
        ...defaultParams,
        amount: '0x0',
      });

      expect(result).toBe('Permission details unavailable');
    });

    it('should handle empty string amount as unavailable', () => {
      const result = formatGatorAmountLabel({
        ...defaultParams,
        amount: '',
      });

      expect(result).toBe('Permission details unavailable');
    });

    it('should handle invalid decimal string as unavailable', () => {
      const result = formatGatorAmountLabel({
        ...defaultParams,
        amount: 'not-a-number',
      });

      expect(result).toBe('Permission details unavailable');
    });

    it('should handle invalid hex string as unavailable', () => {
      const result = formatGatorAmountLabel({
        ...defaultParams,
        amount: '0xinvalid',
      });

      expect(result).toBe('Permission details unavailable');
    });

    it('should format with different token symbols', () => {
      const result = formatGatorAmountLabel({
        ...defaultParams,
        amount: '0xf4240', // 1,000,000 in hex (1 USDC with 6 decimals)
        tokenSymbol: 'USDC',
        tokenDecimals: 6,
      });

      expect(result).toBe('1 USDC per second');
    });

    it('should handle amounts with many decimals', () => {
      const result = formatGatorAmountLabel({
        ...defaultParams,
        amount: '0x38d7ea4c68000', // 0.001 ETH in wei
      });

      expect(result).toBe('0.001 ETH per second');
    });
  });

  describe('getGatorPermissionDisplayMetadata', () => {
    it('should return correct metadata for native-token-stream', () => {
      const result = getGatorPermissionDisplayMetadata('native-token-stream', {
        amountPerSecond: '0x1',
      });

      expect(result).toStrictEqual({
        displayNameKey: 'tokenStream',
        amount: '0x1',
        frequencyKey: 'perSecond',
      });
    });

    it('should return correct metadata for erc20-token-stream', () => {
      const result = getGatorPermissionDisplayMetadata('erc20-token-stream', {
        amountPerSecond: '0x2',
      });

      expect(result).toStrictEqual({
        displayNameKey: 'tokenStream',
        amount: '0x2',
        frequencyKey: 'perSecond',
      });
    });

    it('should return correct metadata for native-token-periodic with daily period', () => {
      const result = getGatorPermissionDisplayMetadata(
        'native-token-periodic',
        {
          periodAmount: '0x100',
          periodDuration: String(86400), // 1 day in seconds
        },
      );

      expect(result).toStrictEqual({
        displayNameKey: 'tokenSubscription',
        amount: '0x100',
        frequencyKey: 'gatorPermissionDailyFrequency',
      });
    });

    it('should return correct metadata for erc20-token-periodic with weekly period', () => {
      const result = getGatorPermissionDisplayMetadata('erc20-token-periodic', {
        periodAmount: '0x200',
        periodDuration: String(604800), // 1 week in seconds
      });

      expect(result).toStrictEqual({
        displayNameKey: 'tokenSubscription',
        amount: '0x200',
        frequencyKey: 'gatorPermissionWeeklyFrequency',
      });
    });

    it('should return correct metadata for native-token-periodic with monthly period', () => {
      const result = getGatorPermissionDisplayMetadata(
        'native-token-periodic',
        {
          periodAmount: '0x300',
          periodDuration: String(2592000), // 1 month in seconds (30 days * 86400 seconds/day)
        },
      );

      expect(result).toStrictEqual({
        displayNameKey: 'tokenSubscription',
        amount: '0x300',
        frequencyKey: 'gatorPermissionMonthlyFrequency',
      });
    });

    it('should handle missing periodDuration as custom frequency', () => {
      const result = getGatorPermissionDisplayMetadata('erc20-token-periodic', {
        periodAmount: '0x400',
      });

      expect(result).toStrictEqual({
        displayNameKey: 'tokenSubscription',
        amount: '0x400',
        frequencyKey: 'gatorPermissionCustomFrequency',
      });
    });

    it('should return default metadata for unknown permission type', () => {
      const result = getGatorPermissionDisplayMetadata('unknown-type', {});

      expect(result).toStrictEqual({
        displayNameKey: 'permission',
        amount: '',
        frequencyKey: '',
      });
    });

    it('should return default metadata for custom permission type', () => {
      const result = getGatorPermissionDisplayMetadata('custom', {
        someData: 'value',
      });

      expect(result).toStrictEqual({
        displayNameKey: 'permission',
        amount: '',
        frequencyKey: '',
      });
    });
  });
});
