import { CaipAssetType } from '@metamask/utils';
import nock from 'nock';
import { buildTokenFromCaipAssetId } from './build-token-from-caip-asset-id';

describe('buildTokenFromCaipAssetId', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('builds an EVM ERC-20 token from a CAIP-19 asset id', async () => {
    const assetId =
      'eip155:1/erc20:0x6b175474e89094c44da98b954eedeac495271d0f' as const;

    nock('https://tokens.api.cx.metamask.io')
      .get('/v3/assets')
      .query({
        assetIds: assetId.toLowerCase(),
      })
      .reply(200, [
        {
          assetId,
          symbol: 'DAI',
          name: 'Dai Stablecoin',
          decimals: 18,
        },
      ]);

    const token = await buildTokenFromCaipAssetId(assetId);

    expect(token).toMatchObject({
      address: '0x6b175474e89094c44da98b954eedeac495271d0f',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      chainId: '0x1',
      decimals: 18,
      isNative: false,
    });
  });

  it('builds a native EVM token from a CAIP-19 asset id', async () => {
    const token = await buildTokenFromCaipAssetId('eip155:1/slip44:60');

    expect(token).toMatchObject({
      symbol: 'ETH',
      chainId: '0x1',
      isNative: true,
      decimals: 18,
    });
  });

  it('returns undefined for an invalid CAIP-19 asset id', async () => {
    const token = await buildTokenFromCaipAssetId(
      'not-a-caip-asset-id' as CaipAssetType,
    );

    expect(token).toBeUndefined();
  });
});
