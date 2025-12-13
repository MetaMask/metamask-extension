import { isTempoNetwork, shouldHideTempoToken } from './tempo-utils';

describe('isTempoNetwork', () => {
  it('returns true for Tempo Testnet chain ID', () => {
    expect(isTempoNetwork('0xa5bd')).toBe(true);
  });

  it('handles uppercase chain ID', () => {
    expect(isTempoNetwork('0xA5BD')).toBe(true);
  });

  it('returns false for non-Tempo chain IDs', () => {
    expect(isTempoNetwork('0x1')).toBe(false);
    expect(isTempoNetwork('0x89')).toBe(false);
  });
});

describe('shouldHideTempoToken', () => {
  const TEMPO_CHAIN_ID = '0xa5bd';
  const NON_TEMPO_CHAIN_ID = '0x1';

  it('returns true for native tokens on Tempo', () => {
    expect(shouldHideTempoToken(TEMPO_CHAIN_ID, true, 'ETH')).toBe(true);
  });

  it('returns true for USD symbol on Tempo', () => {
    expect(shouldHideTempoToken(TEMPO_CHAIN_ID, false, 'USD')).toBe(true);
    expect(shouldHideTempoToken(TEMPO_CHAIN_ID, false, 'usd')).toBe(true);
  });

  it('returns false for other tokens on Tempo', () => {
    expect(shouldHideTempoToken(TEMPO_CHAIN_ID, false, 'USDC')).toBe(false);
    expect(shouldHideTempoToken(TEMPO_CHAIN_ID, false, 'ETH')).toBe(false);
  });

  it('returns false for tokens on non-Tempo networks', () => {
    expect(shouldHideTempoToken(NON_TEMPO_CHAIN_ID, true, 'ETH')).toBe(false);
    expect(shouldHideTempoToken(NON_TEMPO_CHAIN_ID, false, 'USD')).toBe(false);
  });

  it('returns false when symbol is undefined', () => {
    expect(shouldHideTempoToken(TEMPO_CHAIN_ID, false, undefined)).toBe(false);
  });
});

