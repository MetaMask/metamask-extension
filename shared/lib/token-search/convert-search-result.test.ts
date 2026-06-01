import { convertSearchResultToImportPayload } from './convert-search-result';

describe('convertSearchResultToImportPayload', () => {
  const base = {
    symbol: 'USDC',
    decimals: 6,
    name: 'USD Coin',
  };

  it('returns a normalised payload for an EVM ERC20 result', () => {
    const payload = convertSearchResultToImportPayload({
      ...base,
      assetId: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    });

    expect(payload).toStrictEqual({
      assetId: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      caipChainId: 'eip155:1',
      assetReference: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      assetNamespace: 'erc20',
      hexChainId: '0x1',
      isEvm: true,
      isNative: false,
      symbol: 'USDC',
      decimals: 6,
      name: 'USD Coin',
      iconUrl: undefined,
    });
  });

  it('preserves the iconUrl when present', () => {
    const payload = convertSearchResultToImportPayload({
      ...base,
      assetId: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      iconUrl: 'https://example.com/usdc.png',
    });
    expect(payload?.iconUrl).toBe('https://example.com/usdc.png');
  });

  it('flags slip44 (native) assets', () => {
    const payload = convertSearchResultToImportPayload({
      ...base,
      symbol: 'ETH',
      decimals: 18,
      name: 'Ether',
      assetId: 'eip155:1/slip44:60',
    });
    expect(payload?.isNative).toBe(true);
  });

  it('flags the EVM zero-address as native', () => {
    const payload = convertSearchResultToImportPayload({
      ...base,
      symbol: 'ETH',
      decimals: 18,
      name: 'Ether',
      assetId: 'eip155:1/erc20:0x0000000000000000000000000000000000000000',
    });
    expect(payload?.isNative).toBe(true);
  });

  it('handles non-EVM CAIP-19 ids', () => {
    const payload = convertSearchResultToImportPayload({
      ...base,
      assetId:
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    });
    expect(payload?.isEvm).toBe(false);
    expect(payload?.hexChainId).toBeUndefined();
    expect(payload?.caipChainId).toBe(
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    );
  });

  it('returns undefined when the asset id cannot be parsed', () => {
    expect(
      convertSearchResultToImportPayload({
        ...base,
        assetId: 'not-a-valid-caip-id',
      }),
    ).toBeUndefined();
  });

  it('returns undefined when the EVM chain reference is not numeric', () => {
    expect(
      convertSearchResultToImportPayload({
        ...base,
        assetId: 'eip155:abc/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      }),
    ).toBeUndefined();
  });
});
