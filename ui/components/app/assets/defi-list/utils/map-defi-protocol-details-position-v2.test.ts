import { mapDefiProtocolDetailsPositionV2ToToken } from './map-defi-protocol-details-position-v2';
import type { DefiProtocolDetailsPosition } from './group-defi-protocol-details';

describe('mapDefiProtocolDetailsPositionV2ToToken', () => {
  const position: DefiProtocolDetailsPosition = {
    assetId: 'eip155:59144/erc20:0xmusd',
    chainId: 'eip155:59144',
    symbol: 'mUSD',
    name: 'MetaMask USD',
    balance: '1000000000000000000',
    normalizedBalance: 0.00001,
    decimals: 18,
    tokenFiatAmount: 0.00001,
    positionType: 'supply',
    poolAddress: '0xpool',
    tokenImage: 'musd.png',
  };

  it('maps precomputed fiat and converts CAIP chain id to hex', () => {
    expect(mapDefiProtocolDetailsPositionV2ToToken(position)).toMatchObject({
      title: 'MetaMask USD',
      tokenFiatAmount: 0.00001,
      chainId: '0xe708',
      secondary: null,
      assetId: 'eip155:59144/erc20:0xmusd',
    });
  });
});
