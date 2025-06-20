import { Token } from '@metamask/assets-controllers';
import {
  findAssetByAddress,
  fromIso8601DurationToPriceApiTimePeriod,
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
});
