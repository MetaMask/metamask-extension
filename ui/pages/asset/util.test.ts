import { Token } from '@metamask/assets-controllers';
import {
  findAssetByAddress,
  fromIso8601DurationToPriceApiTimePeriod,
  getDynamicShortDate,
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
});
