/**
 * @jest-environment jsdom
 */
import {
  AssetStandard,
  type AssetType,
} from '../../../../../components/app/asset-picker';
import {
  CHAIN_ID_TOKEN_IMAGE_MAP,
  CHAIN_IDS,
} from '../../../../../../shared/constants/network';
import {
  filterRampsTokensByEnabledNetworks,
  mapRampsTokenToSendAsset,
  mapRampsTokensToSendAssets,
} from './mapRampsTokensToSendAssets';

const ethToken = {
  assetId: 'eip155:1/slip44:60',
  chainId: 'eip155:1',
  name: 'Ethereum',
  symbol: 'ETH',
  decimals: 18,
  iconUrl: 'https://example.com/eth.png',
  tokenSupported: true,
};

const usdcToken = {
  assetId: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  chainId: 'eip155:1',
  name: 'USD Coin',
  symbol: 'USDC',
  decimals: 6,
  iconUrl: 'https://example.com/usdc.png',
  tokenSupported: false,
};

describe('mapRampsTokensToSendAssets', () => {
  it('filters tokens to enabled networks only', () => {
    const filtered = filterRampsTokensByEnabledNetworks(
      [ethToken, { ...usdcToken, chainId: 'eip155:137' }],
      { 'eip155:1': { name: 'Ethereum' } },
    );

    expect(filtered).toEqual([ethToken]);
  });

  it('maps ramps tokens into send assets', () => {
    const mapped = mapRampsTokensToSendAssets([ethToken, usdcToken], {
      'eip155:1': { name: 'Ethereum Mainnet' },
    });

    expect(mapped).toMatchSnapshot();
    expect(mapped[0]).toMatchObject({
      assetId: ethToken.assetId,
      chainId: '0x1',
      image: CHAIN_ID_TOKEN_IMAGE_MAP[CHAIN_IDS.MAINNET],
      isNative: true,
      standard: AssetStandard.Native,
      disabled: false,
    } satisfies Partial<AssetType>);
    expect(mapped[1]).toMatchObject({
      address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      isNative: false,
      standard: AssetStandard.ERC20,
      disabled: true,
    });
  });

  it('maps a single token with provided network details', () => {
    expect(
      mapRampsTokenToSendAsset(ethToken, {
        networkName: 'Ethereum',
        networkImage: 'eth.png',
      }),
    ).toMatchSnapshot();
  });

  it('resolves native token images from chain maps when iconUrl is empty', () => {
    const polygonNative = {
      assetId: 'eip155:137/slip44:966',
      chainId: 'eip155:137',
      name: 'Polygon',
      symbol: 'POL',
      decimals: 18,
      iconUrl: '',
      tokenSupported: true,
    };

    expect(
      mapRampsTokenToSendAsset(polygonNative, {
        networkName: 'Polygon',
        networkImage: 'polygon.png',
      }),
    ).toMatchObject({
      chainId: CHAIN_IDS.POLYGON,
      image: CHAIN_ID_TOKEN_IMAGE_MAP[CHAIN_IDS.POLYGON],
      isNative: true,
    });
  });
});
