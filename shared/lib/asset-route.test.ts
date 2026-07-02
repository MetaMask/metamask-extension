import { CaipAssetType } from '@metamask/utils';
import { CHAIN_IDS } from '../constants/network';
import {
  buildAssetRoutePath,
  buildAssetRoutePathFromParts,
  processAssetParams,
  resolveAssetRouteLookup,
} from './asset-route';

describe('asset-route', () => {
  describe('buildAssetRoutePath', () => {
    it('builds a CAIP-19 path for native Arbitrum ETH', () => {
      expect(buildAssetRoutePath('eip155:42161/slip44:60')).toBe(
        '/asset/eip155:42161/eip155%3A42161%2Fslip44%3A60',
      );
    });

    it('builds a CAIP-19 path for an ERC-20 token', () => {
      const assetId =
        'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as CaipAssetType;
      expect(buildAssetRoutePath(assetId)).toBe(
        '/asset/eip155:1/eip155%3A1%2Ferc20%3A0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      );
    });
  });

  describe('buildAssetRoutePathFromParts', () => {
    it('builds a native EVM asset path from hex chain id', () => {
      expect(
        buildAssetRoutePathFromParts(CHAIN_IDS.ARBITRUM, '', {
          isNative: true,
        }),
      ).toBe('/asset/eip155:42161/eip155%3A42161%2Fslip44%3A60');
    });

    it('builds a native EVM asset path when assetId is a zero address', () => {
      expect(
        buildAssetRoutePathFromParts(CHAIN_IDS.MAINNET, '', {
          assetId:
            '0x0000000000000000000000000000000000000000' as CaipAssetType,
          isNative: true,
        }),
      ).toBe('/asset/eip155:1/eip155%3A1%2Fslip44%3A60');
    });

    it('builds an ERC-20 asset path from hex chain id and address', () => {
      expect(
        buildAssetRoutePathFromParts(
          CHAIN_IDS.MAINNET,
          '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        ),
      ).toBe(
        '/asset/eip155:1/eip155%3A1%2Ferc20%3A0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      );
    });
    it('returns undefined for an invalid asset id option', () => {
      expect(
        buildAssetRoutePathFromParts(CHAIN_IDS.MAINNET, '', {
          assetId: 'not-a-caip-asset-id' as CaipAssetType,
          isNative: true,
        }),
      ).toBe('/asset/eip155:1/eip155%3A1%2Fslip44%3A60');
    });
  });

  describe('processAssetParams', () => {
    const solanaChainId = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' as const;
    const solanaTokenRef =
      'token:3iQL8BFS2vE7mww4ehAqQHAsbmRNCrPxizWAT2Zfyr9y' as const;
    const solanaAssetId = `${solanaChainId}/${solanaTokenRef}` as const;

    it('rejoins a CAIP asset id split across asset and id params', () => {
      expect(
        processAssetParams({
          chainId: solanaChainId,
          asset: solanaChainId,
          id: solanaTokenRef,
        }),
      ).toMatchObject({
        decodedAsset: solanaAssetId,
      });
    });

    it('keeps the full CAIP asset id when it arrives in a single asset param', () => {
      expect(
        processAssetParams({
          chainId: solanaChainId,
          asset: solanaAssetId,
        }),
      ).toMatchObject({
        decodedAsset: solanaAssetId,
      });
    });

    it('does not throw when the asset param contains malformed percent-encoding', () => {
      expect(
        processAssetParams({
          chainId: 'eip155:1',
          asset: 'eip155:1%ZZ',
        }),
      ).toMatchObject({
        decodedAsset: 'eip155:1%ZZ',
      });
    });
  });

  describe('resolveAssetRouteLookup', () => {
    it('normalizes a CAIP-19 native EVM route to hex chain id lookup', () => {
      expect(
        resolveAssetRouteLookup({
          chainId: 'eip155:42161',
          asset: 'eip155:42161/slip44:60',
        }),
      ).toMatchObject({
        chainId: 'eip155:42161',
        decodedAsset: undefined,
        assetId: 'eip155:42161/slip44:60',
      });
    });

    it('normalizes a CAIP-19 ERC-20 route to hex chain id and address lookup', () => {
      expect(
        resolveAssetRouteLookup({
          chainId: 'eip155:1',
          asset: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        }),
      ).toMatchObject({
        chainId: 'eip155:1',
        decodedAsset: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        assetId: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      });
    });

    it('preserves NFT routes that use a contract address and token id', () => {
      expect(
        resolveAssetRouteLookup({
          chainId: CHAIN_IDS.MAINNET,
          asset: '0xabc',
          id: '123',
        }),
      ).toMatchObject({
        chainId: CHAIN_IDS.MAINNET,
        decodedAsset: '0xabc',
        id: '123',
      });
    });
  });
});
