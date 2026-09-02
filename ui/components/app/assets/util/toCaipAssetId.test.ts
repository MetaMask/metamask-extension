import type { Asset } from '@metamask/assets-controllers';
import type { CaipAssetType } from '@metamask/utils';
import { toCaipAssetId } from './toCaipAssetId';

const asAsset = (asset: Partial<Asset>) => asset as Asset;

describe('toCaipAssetId', () => {
  it('passes through a CAIP-19 asset id', () => {
    const assetId =
      'bip122:000000000019d6689c085ae165831e93/slip44:0' as CaipAssetType;

    expect(toCaipAssetId(asAsset({ assetId }))).toBe(assetId);
  });

  it('lowercases EVM CAIP-19 asset ids', () => {
    expect(
      toCaipAssetId(
        asAsset({
          assetId: 'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        }),
      ),
    ).toBe('eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
  });

  it('builds a CAIP-19 id from a hex assetId and chain id', () => {
    expect(
      toCaipAssetId(
        asAsset({
          assetId: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          chainId: '0x1',
        }),
      ),
    ).toBe('eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
  });

  it('resolves an EVM native token to slip44', () => {
    expect(
      toCaipAssetId(
        asAsset({
          address: '0x0000000000000000000000000000000000000000',
          chainId: '0x1',
          isNative: true,
        }),
      ),
    ).toBe('eip155:1/slip44:60');
  });

  it('returns undefined when nothing can be resolved', () => {
    expect(toCaipAssetId(asAsset({}))).toBeUndefined();
  });
});
