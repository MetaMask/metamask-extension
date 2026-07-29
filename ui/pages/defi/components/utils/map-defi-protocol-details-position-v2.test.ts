import {
  getNativeTokenAddress,
  type DeFiUnderlyingPosition,
} from '@metamask/assets-controllers';
import { toChecksumHexAddress } from '../../../../../shared/lib/hexstring-utils';
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
    positionType: 'deposit',
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

  it('marks native assets and uses the chain native token address', () => {
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
      address: getNativeTokenAddress('0xe708'),
    });
  });

  it('uses Polygon native token address for Polygon slip44 assets', () => {
    const polygonNativePosition: DeFiUnderlyingPosition = {
      ...position,
      assetId: 'eip155:137/slip44:966',
      chainId: 'eip155:137',
      symbol: 'POL',
      name: 'Polygon',
    };

    expect(
      mapDefiProtocolDetailsPositionV2ToToken(polygonNativePosition),
    ).toMatchObject({
      isNative: true,
      address: getNativeTokenAddress('0x89'),
      chainId: '0x89',
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

  it('defaults image to an empty string when tokenImage is missing', () => {
    const positionWithoutImage: DeFiUnderlyingPosition = {
      ...position,
      tokenImage: undefined,
    };

    expect(
      mapDefiProtocolDetailsPositionV2ToToken(positionWithoutImage),
    ).toMatchObject({
      image: '',
    });
  });

  it('returns a checksummed hex address for an ERC-20 asset', () => {
    const lowercaseAddress = '0xae7ab96520de3a18e5e111b5eaab095312d7fe84';
    const erc20Position: DeFiUnderlyingPosition = {
      ...position,
      assetId: `eip155:1/erc20:${lowercaseAddress}`,
      chainId: 'eip155:1',
    };

    const { address } = mapDefiProtocolDetailsPositionV2ToToken(erc20Position);

    expect(address).toBe(toChecksumHexAddress(lowercaseAddress));
    // Checksumming must actually mix case, not pass the input through as-is.
    expect(address).not.toBe(lowercaseAddress);
    expect(address).toMatch(/[A-F]/u);
  });

  it('falls back to 0 when the balance is not a valid number', () => {
    const invalidBalancePosition: DeFiUnderlyingPosition = {
      ...position,
      balance: 'not-a-number',
    };

    expect(
      mapDefiProtocolDetailsPositionV2ToToken(invalidBalancePosition),
    ).toMatchObject({
      balance: '0',
      string: '0',
    });
  });

  it('passes a non-EVM CAIP chain id and asset id through unchanged', () => {
    const solanaChainId = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
    const solanaAssetId = `${solanaChainId}/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`;
    const solanaPosition: DeFiUnderlyingPosition = {
      ...position,
      assetId: solanaAssetId,
      chainId: solanaChainId,
    };

    expect(
      mapDefiProtocolDetailsPositionV2ToToken(solanaPosition),
    ).toMatchObject({
      chainId: solanaChainId,
      address: solanaAssetId,
    });
  });
});
