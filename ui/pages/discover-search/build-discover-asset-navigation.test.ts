import type { CaipAssetType } from '@metamask/utils';

import { buildDiscoverAssetNavigation } from './build-discover-asset-navigation';

describe('buildDiscoverAssetNavigation', () => {
  it('builds a CAIP route with location-state token for native EVM assets', () => {
    const result = buildDiscoverAssetNavigation({
      assetId: 'eip155:1/slip44:60' as CaipAssetType,
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
      price: '2500',
    });

    expect(result).toStrictEqual({
      path: '/asset/eip155:1/eip155%3A1%2Fslip44%3A60',
      state: {
        token: {
          address: '',
          symbol: 'ETH',
          name: 'Ethereum',
          chainId: '0x1',
          image: expect.any(String),
          isNative: true,
          decimals: 18,
          price: 2500,
        },
      },
    });
  });

  it('builds a CAIP route with location-state token for ERC-20 assets', () => {
    const assetId =
      'eip155:8453/erc20:0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf' as CaipAssetType;

    const result = buildDiscoverAssetNavigation({
      assetId,
      name: 'Coinbase Wrapped BTC',
      symbol: 'CBBTC',
      decimals: 8,
      price: '65000.12',
    });

    expect(result).toStrictEqual({
      path: '/asset/eip155:8453/eip155%3A8453%2Ferc20%3A0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf',
      state: {
        token: {
          address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
          symbol: 'CBBTC',
          name: 'Coinbase Wrapped BTC',
          chainId: '0x2105',
          image: expect.any(String),
          isNative: false,
          decimals: 8,
          price: 65000.12,
        },
      },
    });
  });

  it('builds a CAIP route with CAIP chainId/address for Solana assets', () => {
    const assetId =
      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' as CaipAssetType;

    const result = buildDiscoverAssetNavigation({
      assetId,
      name: 'USD Coin',
      symbol: 'USDC',
      decimals: 6,
    });

    expect(result).toStrictEqual({
      path: `/asset/solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/${encodeURIComponent(assetId)}`,
      state: {
        token: {
          address: assetId,
          symbol: 'USDC',
          name: 'USD Coin',
          chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          image: expect.any(String),
          isNative: false,
          decimals: 6,
        },
      },
    });
  });

  it('returns null for an invalid asset id', () => {
    expect(
      buildDiscoverAssetNavigation({
        assetId: 'not-a-caip-asset-id' as CaipAssetType,
        name: 'Bad',
        symbol: 'BAD',
        decimals: 18,
      }),
    ).toBeNull();
  });
});
