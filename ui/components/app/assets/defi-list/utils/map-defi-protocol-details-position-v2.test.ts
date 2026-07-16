import type { DeFiUnderlyingPosition } from '@metamask/assets-controllers';
import { mapDefiProtocolDetailsPositionV2ToToken } from './map-defi-protocol-details-position-v2';

describe('mapDefiProtocolDetailsPositionV2ToToken', () => {
  const position: DeFiUnderlyingPosition = {
    assetId: 'eip155:59144/erc20:0xmusd',
    chainId: 'eip155:59144',
    symbol: 'mUSD',
    name: 'MetaMask USD',
    balance: '0.00001',
    decimals: 18,
    marketValue: 0.00001,
    positionType: 'supply',
    poolAddress: '0xpool',
    groupId: 'group-musd-1',
    tokenImage: 'musd.png',
  };

  it('maps precomputed fiat and converts CAIP chain id to hex', () => {
    expect(mapDefiProtocolDetailsPositionV2ToToken(position)).toMatchObject({
      title: 'MetaMask USD',
      symbol: 'mUSD',
      tokenFiatAmount: 0.00001,
      chainId: '0xe708',
      secondary: null,
      assetId: 'eip155:59144/erc20:0xmusd',
      isNative: false,
    });
  });

  it('marks native assets and keeps symbol separate from name', () => {
    const nativePosition: DeFiUnderlyingPosition = {
      ...position,
      assetId: 'eip155:59144/slip44:60',
      symbol: 'ETH',
      name: 'Ethereum',
    };

    expect(
      mapDefiProtocolDetailsPositionV2ToToken(nativePosition),
    ).toMatchObject({
      title: 'Ethereum',
      symbol: 'ETH',
      isNative: true,
    });
  });

  it('leaves fiat amount null when market value is unavailable', () => {
    const positionWithoutPrice: DeFiUnderlyingPosition = {
      ...position,
      marketValue: undefined,
    };

    expect(
      mapDefiProtocolDetailsPositionV2ToToken(positionWithoutPrice),
    ).toMatchObject({
      tokenFiatAmount: null,
    });
  });
});
