import {
  getErc20AddressFromAssetId,
  getRampsTokenDisplaySymbol,
} from './token-display';

describe('getErc20AddressFromAssetId', () => {
  it('extracts the ERC-20 contract address from a CAIP-19 asset id', () => {
    expect(
      getErc20AddressFromAssetId(
        'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      ),
    ).toBe('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
  });

  it('returns undefined for native asset ids', () => {
    expect(getErc20AddressFromAssetId('eip155:1/slip44:60')).toBeUndefined();
  });

  it('returns undefined for invalid asset ids', () => {
    expect(getErc20AddressFromAssetId('eip155:1')).toBeUndefined();
  });
});

describe('getRampsTokenDisplaySymbol', () => {
  it('canonicalises the uppercase registry symbol of mUSD to the branded casing', () => {
    expect(
      getRampsTokenDisplaySymbol({
        assetId: 'eip155:1/erc20:0xaca92e438df0b2401ff60da7e4337b687a2435da',
        chainId: 'eip155:1',
        name: 'MetaMask USD',
        symbol: 'MUSD',
        decimals: 6,
        iconUrl: 'https://example.com/musd.png',
        tokenSupported: true,
      }),
    ).toBe('mUSD');
  });

  it('canonicalises mUSD regardless of address casing in the asset id', () => {
    expect(
      getRampsTokenDisplaySymbol({
        assetId:
          'eip155:59144/erc20:0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
        chainId: 'eip155:59144',
        name: 'MetaMask USD',
        symbol: 'MUSD',
        decimals: 6,
        iconUrl: 'https://example.com/musd.png',
        tokenSupported: true,
      }),
    ).toBe('mUSD');
  });

  it('leaves non-mUSD token symbols unchanged', () => {
    expect(
      getRampsTokenDisplaySymbol({
        assetId: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        chainId: 'eip155:1',
        name: 'USD Coin',
        symbol: 'USDC',
        decimals: 6,
        iconUrl: 'https://example.com/usdc.png',
        tokenSupported: false,
      }),
    ).toBe('USDC');
  });

  it('leaves native asset symbols unchanged', () => {
    expect(
      getRampsTokenDisplaySymbol({
        assetId: 'eip155:1/slip44:60',
        chainId: 'eip155:1',
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
        iconUrl: 'https://example.com/eth.png',
        tokenSupported: true,
      }),
    ).toBe('ETH');
  });

  it('returns an empty string for a missing token', () => {
    expect(getRampsTokenDisplaySymbol(undefined)).toBe('');
  });

  it('returns an empty string when the token has no symbol', () => {
    expect(
      getRampsTokenDisplaySymbol({
        assetId: 'eip155:1/erc20:0xaca92e438df0b2401ff60da7e4337b687a2435da',
        chainId: 'eip155:1',
        name: 'MetaMask USD',
        symbol: '',
        decimals: 6,
        iconUrl: 'https://example.com/musd.png',
        tokenSupported: true,
      }),
    ).toBe('');
  });
});
