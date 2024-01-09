import { MAX_SAFE_CHAIN_ID } from '../constants/network';
import {
  isSafeChainId,
  isPrefixedFormattedHexString,
  isTokenDetectionEnabledForNetwork,
} from './network.utils';

describe('network utils', () => {
  describe('isSafeChainId', () => {
    it('returns true given an integer greater than 0 and less than or equal to the max safe chain ID', () => {
      expect(isSafeChainId(3)).toBe(true);
    });

    it('returns true given the max safe chain ID', () => {
      expect(isSafeChainId(MAX_SAFE_CHAIN_ID)).toBe(true);
    });

    it('returns false given something other than an integer', () => {
      expect(isSafeChainId('not-an-integer')).toBe(false);
    });

    it('returns false given a negative integer', () => {
      expect(isSafeChainId(-1)).toBe(false);
    });

    it('returns false given an integer greater than the max safe chain ID', () => {
      expect(isSafeChainId(MAX_SAFE_CHAIN_ID + 1)).toBe(false);
    });
  });

  describe('isPrefixedFormattedHexString', () => {
    it('returns true given a string that matches a hex number formatted as a "0x"-prefixed, non-zero, non-zero-padded string', () => {
      expect(isPrefixedFormattedHexString('0x1')).toBe(true);
      expect(isPrefixedFormattedHexString('0xa')).toBe(true);
      expect(isPrefixedFormattedHexString('0xabc123')).toBe(true);
    });

    it('returns true given a "0x"-prefixed hex string that contains uppercase characters', () => {
      expect(isPrefixedFormattedHexString('0XABC123')).toBe(true);
    });

    it('returns false given a "0x"-prefixed hex string that evaluates to zero', () => {
      expect(isPrefixedFormattedHexString('0x0')).toBe(false);
    });

    it('returns false given a "0x"-prefixed hex string that does not evaluate to zero but is zero-padded', () => {
      expect(isPrefixedFormattedHexString('0x01')).toBe(false);
    });

    it('returns false given a hex number that is simply a string but not "0x"-prefixed', () => {
      expect(isPrefixedFormattedHexString('abc123')).toBe(false);
    });

    it('returns false if given something other than a string', () => {
      expect(isPrefixedFormattedHexString({ something: 'else' })).toBe(false);
    });
  });

  describe('isTokenDetectionEnabledForNetwork', () => {
    it('returns true given the chain ID for Mainnet', () => {
      expect(isTokenDetectionEnabledForNetwork('0x1')).toBe(true);
    });

    it('returns true given the chain ID for BSC', () => {
      expect(isTokenDetectionEnabledForNetwork('0x38')).toBe(true);
    });

    it('returns true given the chain ID for Polygon', () => {
      expect(isTokenDetectionEnabledForNetwork('0x89')).toBe(true);
    });

    it('returns true given the chain ID for Avalanche', () => {
      expect(isTokenDetectionEnabledForNetwork('0xa86a')).toBe(true);
    });

    it('returns false given a string that is not the chain ID for Mainnet, BSC, Polygon, or Avalanche', () => {
      expect(isTokenDetectionEnabledForNetwork('some other chain ID')).toBe(
        false,
      );
    });

    it('returns false given undefined', () => {
      expect(isTokenDetectionEnabledForNetwork(undefined)).toBe(false);
    });
  });
});
