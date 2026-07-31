import { CaipAssetType } from '@metamask/utils';
import { CHAIN_IDS } from '../constants/network';
import {
  buildAssetRoutePath,
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
    it('throws for an invalid CAIP asset type', () => {
      expect(() =>
        buildAssetRoutePath('not-a-caip-asset-id' as CaipAssetType),
      ).toThrow('Invalid CAIP asset type');
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

    it('normalizes a Solana SPL route to a CAIP-19 asset id', () => {
      const solanaChainId = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' as const;
      const assetId =
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' as const;

      expect(
        resolveAssetRouteLookup({
          chainId: solanaChainId,
          asset: assetId,
        }),
      ).toMatchObject({
        chainId: solanaChainId,
        assetId,
      });
    });

    it('returns the original params when CAIP asset parsing fails', () => {
      expect(
        resolveAssetRouteLookup({
          chainId: CHAIN_IDS.MAINNET,
          asset: 'not-a-caip-asset-id',
        }),
      ).toMatchObject({
        chainId: CHAIN_IDS.MAINNET,
        decodedAsset: 'not-a-caip-asset-id',
      });
    });
  });
});
