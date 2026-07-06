import { Token } from '@metamask/assets-controllers';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { type AssetRouteParams } from '../../../shared/lib/asset-route';
import {
  findAssetByAddress,
  fromIso8601DurationToPriceApiTimePeriod,
  getDynamicShortDate,
  processAssetParams,
} from './util';

describe('utils', () => {
  describe('findAssetByAddress', () => {
    const mockTokens: Record<string, Token[]> = {
      '0x1': [
        { address: '0xabc', decimals: 18, symbol: 'ABC', name: 'Token ABC' },
        { address: '0xdef', decimals: 18, symbol: 'DEF', name: 'Token DEF' },
      ],
      '0x2': [
        { address: '0x123', decimals: 18, symbol: 'XYZ', name: 'Token XYZ' },
        { address: '0x456', decimals: 18, symbol: 'LMN', name: 'Token LMN' },
      ],
    };

    it('should return null and log error when chainId is not provided', () => {
      console.error = jest.fn();
      expect(findAssetByAddress(mockTokens, '0xabc')).toBeNull();
      expect(console.error).toHaveBeenCalledWith('Chain ID is required.');
    });

    it('should return null and log warning when no tokens are found for chainId', () => {
      console.warn = jest.fn();
      expect(findAssetByAddress(mockTokens, '0x123', '0x99')).toBeNull();
      expect(console.warn).toHaveBeenCalledWith(
        'No tokens found for chainId: 0x99',
      );
    });

    it('should return undefined if address is not provided and no token without address is found', () => {
      expect(findAssetByAddress(mockTokens, undefined, '0x1')).toBeUndefined();
    });

    it('should return the token without address if address is not provided and a token without address exists', () => {
      const tokensWithNullAddress: Record<string, Token[]> = {
        '0x1': [
          { address: '', decimals: 18, symbol: 'NULL', name: 'Token NULL' },
        ],
      };
      expect(
        findAssetByAddress(tokensWithNullAddress, undefined, '0x1'),
      ).toEqual({
        address: '',
        decimals: 18,
        name: 'Token NULL',
        symbol: 'NULL',
      });
    });

    it('should return the correct token when address and chainId are provided', () => {
      expect(findAssetByAddress(mockTokens, '0xabc', '0x1')).toEqual({
        address: '0xabc',
        decimals: 18,
        symbol: 'ABC',
        name: 'Token ABC',
      });
    });

    it('should return undefined if no token matches the provided address on the chainId', () => {
      expect(findAssetByAddress(mockTokens, '0x999', '0x1')).toBeUndefined();
    });

    it('should be case insensitive when matching addresses', () => {
      expect(findAssetByAddress(mockTokens, '0xABC', '0x1')).toEqual({
        address: '0xabc',
        decimals: 18,
        symbol: 'ABC',
        name: 'Token ABC',
      });
    });
  });

  describe('fromIso8601DurationToPriceApiTimePeriod', () => {
    it('throws an error if the duration is not a valid ISO 8601 duration', () => {
      expect(() => fromIso8601DurationToPriceApiTimePeriod('5H')).toThrow(
        'Invalid ISO 8601 duration: 5H',
      );
    });

    it('returns the correct time period for a valid duration', () => {
      expect(fromIso8601DurationToPriceApiTimePeriod('P1D')).toEqual('1D');
    });

    it('throws an error if the passed duration does not match any Price API time period', () => {
      expect(() => fromIso8601DurationToPriceApiTimePeriod('P1Y2M')).toThrow(
        'No Price API timePeriod matching the ISO 8601 duration: P1Y2M',
      );
    });
  });

  describe('getDynamicShortDate', () => {
    const originalNavigatorLanguage = navigator.language;
    // Use a fixed "current year" for testing - mock system time to ensure tests don't become flaky
    const MOCKED_CURRENT_DATE = new Date(2025, 6, 1, 12, 0, 0); // July 1, 2025

    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(MOCKED_CURRENT_DATE);
      Object.defineProperty(navigator, 'language', {
        value: 'en-US',
        configurable: true,
      });
    });

    afterAll(() => {
      jest.useRealTimers();
      Object.defineProperty(navigator, 'language', {
        value: originalNavigatorLanguage,
        configurable: true,
      });
    });

    const testCases: {
      description: string;
      input: Date | number;
      expected: string;
    }[] = [
      {
        description: 'formats date in current year without year (Date object)',
        input: new Date(2025, 5, 15, 10, 30), // June 15, 2025, 10:30 AM
        expected: 'Jun 15, 10:30 AM',
      },
      {
        description: 'formats date in previous year with year',
        input: new Date(2024, 5, 15), // June 15, 2024
        expected: 'Jun 15, 2024',
      },
      {
        description: 'formats date in future year with year',
        input: new Date(2099, 11, 31), // Dec 31, 2099
        expected: 'Dec 31, 2099',
      },
      {
        description: 'handles timestamp input for current year',
        input: new Date(2025, 0, 1, 12, 0).getTime(), // Jan 1, 2025, 12:00 PM
        expected: 'Jan 1, 12:00 PM',
      },
      {
        description: 'handles timestamp input for different year',
        input: new Date(2020, 2, 15, 9, 45).getTime(), // Mar 15, 2020, 9:45 AM
        expected: 'Mar 15, 2020',
      },
    ];

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each(testCases)(
      '$description',
      ({ input, expected }: { input: Date | number; expected: string }) => {
        expect(getDynamicShortDate(input)).toBe(expected);
      },
    );
  });

  describe('processAssetParams', () => {
    describe('non-EVM (CAIP) routes', () => {
      const solanaChainId = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' as const;
      const solanaTokenRef =
        'token:3iQL8BFS2vE7mww4ehAqQHAsbmRNCrPxizWAT2Zfyr9y' as const;
      const solanaAssetId = `${solanaChainId}/${solanaTokenRef}` as const;

      const testCases = [
        {
          // Firefox decodes `%2F` in window.location.hash before react-router
          // parses the path, so the single CAIP asset id is split into separate
          // params and must be rejoined.
          name: 'rejoins a CAIP asset id split across the asset and id params',
          params: {
            chainId: solanaChainId,
            asset: solanaChainId,
            id: solanaTokenRef,
          },
          expected: {
            decodedAsset: solanaAssetId,
            chainId: solanaChainId,
            asset: solanaChainId,
            id: solanaTokenRef,
          },
        },
        {
          // Chromium browsers leave `%2F` encoded, so the asset id is not split
          // and the id param is undefined.
          name: 'keeps the full CAIP asset id when it arrives in a single asset param',
          params: {
            chainId: solanaChainId,
            asset: solanaAssetId,
            id: undefined,
          },
          expected: { decodedAsset: solanaAssetId },
        },
        {
          name: 'does not rejoin when a CAIP chain has no id param',
          params: {
            chainId: solanaChainId,
            asset: solanaChainId,
            id: undefined,
          },
          expected: { decodedAsset: solanaChainId },
        },
      ];

      // @ts-expect-error This function is missing from the Mocha type definitions
      it.each(testCases)(
        '$name',
        ({ params, expected }: (typeof testCases)[number]) => {
          expect(processAssetParams(params)).toMatchObject(expected);
        },
      );
    });

    describe('CAIP-19 routes', () => {
      const tokenAddress =
        '0xacA92E438df0B2401fF60dA7E4337B687a2435DA' as const;
      const chainId = 'eip155:1' as const;
      const erc20AssetId = `eip155:1/erc20:${tokenAddress}` as const;
      const nativeAssetId = 'eip155:1/slip44:60' as const;

      const testCases: {
        name: string;
        params: AssetRouteParams;
        expected: Record<string, unknown>;
      }[] = [
        {
          name: 'resolves an ERC-20 CAIP-19 route',
          params: { chainId, asset: erc20AssetId },
          expected: {
            decodedAsset: erc20AssetId,
            chainId,
          },
        },
        {
          name: 'resolves a native CAIP-19 route',
          params: {
            chainId: 'eip155:42161',
            asset: 'eip155:42161/slip44:60',
          },
          expected: {
            decodedAsset: 'eip155:42161/slip44:60',
            chainId: 'eip155:42161',
          },
        },
        {
          name: 'does not rejoin NFT routes that use a contract address and tokenId',
          params: {
            chainId: CHAIN_IDS.MAINNET,
            asset: tokenAddress,
            id: '123',
          },
          expected: { decodedAsset: tokenAddress, id: '123' },
        },
      ];

      // @ts-expect-error This function is missing from the Mocha type definitions
      it.each(testCases)(
        '$name',
        ({ params, expected }: (typeof testCases)[number]) => {
          expect(processAssetParams(params)).toMatchObject(expected);
        },
      );
    });

    it('returns an undefined decodedAsset when no params are present', () => {
      expect(processAssetParams({}).decodedAsset).toBeUndefined();
    });
  });
});
