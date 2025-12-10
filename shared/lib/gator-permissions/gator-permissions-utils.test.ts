import { Hex } from '@metamask/utils';
import { fetchAssetMetadata } from '../asset-utils';
import {
  getGatorErc20TokenInfo,
  formatGatorAmountLabel,
  getGatorPermissionDisplayMetadata,
  clearTokenInfoCaches,
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
    clearTokenInfoCaches();
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

      expect(result1).toStrictEqual({
        symbol: 'CACHED',
        decimals: 18,
        name: undefined,
        image: 'https://example.com/image.png',
        address: mockAddress,
        chainId: mockChainId,
      });
      expect(result2).toStrictEqual({
        symbol: 'CACHED',
        decimals: 18,
        name: undefined,
        image: 'https://example.com/image.png',
        address: mockAddress,
        chainId: mockChainId,
      });
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

      expect(result1).toStrictEqual({
        symbol: 'ETH_TOKEN',
        decimals: 18,
        name: undefined,
        image: 'https://example.com/image1.png',
        address: mockAddress,
        chainId: mockChainId,
      });
      expect(result2).toStrictEqual({
        symbol: 'POLY_TOKEN',
        decimals: 6,
        name: undefined,
        image: 'https://example.com/image2.png',
        address: mockAddress,
        chainId: mockChainId2,
      });
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

      expect(result1).toStrictEqual({
        symbol: 'CASE_TEST',
        decimals: 18,
        name: undefined,
        image: 'https://example.com/image.png',
        address: mockAddress.toLowerCase(),
        chainId: mockChainId,
      });
      expect(result2).toStrictEqual({
        symbol: 'CASE_TEST',
        decimals: 18,
        name: undefined,
        image: 'https://example.com/image.png',
        address: mockAddress.toLowerCase(),
        chainId: mockChainId,
      });
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

      const expectedResult = {
        symbol: 'DEDUPED',
        decimals: 18,
        name: undefined,
        image: 'https://example.com/image.png',
        address: mockAddress,
        chainId: mockChainId,
      };
      expect(result1).toStrictEqual(expectedResult);
      expect(result2).toStrictEqual(expectedResult);
      expect(result3).toStrictEqual(expectedResult);
      // Should only fetch once even with multiple simultaneous calls
      expect(mockFetchAssetMetadata).toHaveBeenCalledTimes(1);
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
