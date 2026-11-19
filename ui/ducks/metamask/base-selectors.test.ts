import { getSwapsTokens } from './base-selectors';

describe('getSwapsTokens', () => {
  it('returns background swaps tokens', () => {
    const tokens = [
      {
        address: '0x0000000000000000000000000000000000000001',
        symbol: 'TEST',
        decimals: 18,
        name: 'Test Token',
        iconUrl: 'https://example.com/token.svg',
      },
    ];
    const state = {
      metamask: { swapsState: { tokens } },
    };

    expect(getSwapsTokens(state)).toBe(tokens);
  });

  it('preserves an empty background token list', () => {
    const state = {
      metamask: { swapsState: { tokens: [] } },
    };

    expect(getSwapsTokens(state)).toBe(state.metamask.swapsState.tokens);
    expect(getSwapsTokens(state)).toEqual([]);
  });
});
