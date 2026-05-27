import { CaipAssetType, CaipChainId } from '@metamask/utils';
import { buildBatchSellAsset } from '../../../../../../test/data/batch-sell';
import { getSourceTokenAddress } from '.';

const EVM_NATIVE_ASSET_ADDRESS = '0x0000000000000000000000000000000000000000';

const buildAsset = (overrides: Record<string, unknown> = {}) =>
  buildBatchSellAsset({ symbol: 'TOKEN', name: 'Token', ...overrides });

describe('getSourceTokenAddress', () => {
  describe('native assets', () => {
    it('returns the zero address for the Ethereum mainnet native asset', () => {
      const asset = buildAsset({
        chainId: 'eip155:1' as CaipChainId,
        assetId: 'eip155:1/slip44:60' as CaipAssetType,
      });

      expect(getSourceTokenAddress(asset)).toBe(EVM_NATIVE_ASSET_ADDRESS);
    });

    it('returns the zero address for the Polygon native asset', () => {
      const asset = buildAsset({
        chainId: 'eip155:137' as CaipChainId,
        assetId: 'eip155:137/slip44:966' as CaipAssetType,
      });

      expect(getSourceTokenAddress(asset)).toBe(EVM_NATIVE_ASSET_ADDRESS);
    });

    it('is case-insensitive when comparing native asset IDs', () => {
      const asset = buildAsset({
        chainId: 'eip155:1' as CaipChainId,
        assetId: 'EIP155:1/SLIP44:60' as CaipAssetType,
      });

      expect(getSourceTokenAddress(asset)).toBe(EVM_NATIVE_ASSET_ADDRESS);
    });
  });

  describe('ERC-20 tokens', () => {
    it('returns the token contract address for an ERC-20 asset', () => {
      const tokenAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
      const asset = buildAsset({
        chainId: 'eip155:1' as CaipChainId,
        assetId: `eip155:1/erc20:${tokenAddress}` as CaipAssetType,
      });

      expect(getSourceTokenAddress(asset)).toBe(tokenAddress);
    });

    it('returns the token contract address for a Polygon ERC-20 asset', () => {
      const tokenAddress = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
      const asset = buildAsset({
        chainId: 'eip155:137' as CaipChainId,
        assetId: `eip155:137/erc20:${tokenAddress}` as CaipAssetType,
      });

      expect(getSourceTokenAddress(asset)).toBe(tokenAddress);
    });
  });
});
