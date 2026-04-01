import { CHAIN_IDS } from '../constants/network';
import { SWAPS_CHAINID_DEFAULT_TOKEN_MAP } from '../constants/swaps';
import {
  isSwapsDefaultTokenAddress,
  isSwapsDefaultTokenSymbol,
} from './swaps.utils';

describe('swaps.utils', () => {
  describe('isSwapsDefaultTokenAddress', () => {
    it('returns true when the address matches the default token address for the given chain', () => {
      const { address } = SWAPS_CHAINID_DEFAULT_TOKEN_MAP[CHAIN_IDS.MAINNET];
      expect(isSwapsDefaultTokenAddress(address, CHAIN_IDS.MAINNET)).toBe(true);
    });

    it('returns false when the address does not match the default token address', () => {
      expect(
        isSwapsDefaultTokenAddress(
          '0x1234567890abcdef1234567890abcdef12345678',
          CHAIN_IDS.MAINNET,
        ),
      ).toBe(false);
    });

    it('returns false when the address is an empty string', () => {
      expect(isSwapsDefaultTokenAddress('', CHAIN_IDS.MAINNET)).toBe(false);
    });

    it('returns false when the chainId is an empty string', () => {
      const { address } = SWAPS_CHAINID_DEFAULT_TOKEN_MAP[CHAIN_IDS.MAINNET];
      expect(isSwapsDefaultTokenAddress(address, '')).toBe(false);
    });

    it('returns false when the chainId is not in the map', () => {
      const { address } = SWAPS_CHAINID_DEFAULT_TOKEN_MAP[CHAIN_IDS.MAINNET];
      expect(isSwapsDefaultTokenAddress(address, '0x999')).toBe(false);
    });
  });

  describe('isSwapsDefaultTokenSymbol', () => {
    it('returns true when the symbol matches the default token symbol for the given chain', () => {
      const { symbol } = SWAPS_CHAINID_DEFAULT_TOKEN_MAP[CHAIN_IDS.MAINNET];
      expect(isSwapsDefaultTokenSymbol(symbol, CHAIN_IDS.MAINNET)).toBe(true);
    });

    it('returns false when the symbol does not match the default token symbol', () => {
      expect(isSwapsDefaultTokenSymbol('NOT_ETH', CHAIN_IDS.MAINNET)).toBe(
        false,
      );
    });

    it('returns false when the symbol is an empty string', () => {
      expect(isSwapsDefaultTokenSymbol('', CHAIN_IDS.MAINNET)).toBe(false);
    });

    it('returns false when the chainId is an empty string', () => {
      const { symbol } = SWAPS_CHAINID_DEFAULT_TOKEN_MAP[CHAIN_IDS.MAINNET];
      expect(isSwapsDefaultTokenSymbol(symbol, '')).toBe(false);
    });

    it('returns false when the chainId is not in the map', () => {
      const { symbol } = SWAPS_CHAINID_DEFAULT_TOKEN_MAP[CHAIN_IDS.MAINNET];
      expect(isSwapsDefaultTokenSymbol(symbol, '0x999')).toBe(false);
    });
  });
});
