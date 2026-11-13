import type { Hex } from '@metamask/utils';
import { isListedStablecoin } from './stablecoins';

const ETH_USDT = '0xdac17f958d2ee523a2206206994597c13d831ec7' as Hex;
const ETH_USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as Hex;
const ARB_USDC = '0xaf88d065e77c8cc2239327c5edb3a432268e5831' as Hex;

const STABLECOINS: Record<Hex, Hex[]> = {
  '0x1': [ETH_USDT, ETH_USDC],
  '0xa4b1': [ARB_USDC],
};

describe('isListedStablecoin', () => {
  it('returns true when the token is listed for its chain', () => {
    expect(isListedStablecoin(STABLECOINS, '0x1', ETH_USDT)).toBe(true);
  });

  it('returns true for a checksummed address', () => {
    expect(
      isListedStablecoin(
        STABLECOINS,
        '0x1',
        '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      ),
    ).toBe(true);
  });

  it('returns true for an uppercase chain ID', () => {
    expect(isListedStablecoin(STABLECOINS, '0xA4B1', ARB_USDC)).toBe(true);
  });

  it('returns false when the token is not listed for its chain', () => {
    expect(
      isListedStablecoin(
        STABLECOINS,
        '0x1',
        '0x1111111111111111111111111111111111111111',
      ),
    ).toBe(false);
  });

  // The same address can be a stablecoin on one chain and an unrelated token
  // on another, so the list is only consulted for the requested chain.
  it('returns false when the token is listed only on another chain', () => {
    expect(isListedStablecoin(STABLECOINS, '0xa4b1', ETH_USDT)).toBe(false);
  });

  it('returns false when the chain has no listed tokens', () => {
    expect(isListedStablecoin(STABLECOINS, '0x89', ETH_USDT)).toBe(false);
  });

  it('returns false when the map is empty', () => {
    expect(isListedStablecoin({}, '0x1', ETH_USDT)).toBe(false);
  });
});
