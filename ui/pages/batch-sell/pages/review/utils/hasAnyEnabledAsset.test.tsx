import { CaipAssetType } from '@metamask/utils';
import { hasAnyEnabledAsset } from './hasAnyEnabledAsset';
import { BatchSellQuotesConfig } from '../types';

type SendAssetsConfig = BatchSellQuotesConfig['sendAssetsConfig'];
type AssetConfig = SendAssetsConfig[CaipAssetType];

const buildAssetConfig = (enabled: boolean): AssetConfig => ({
  asset: {} as AssetConfig['asset'],
  sendAmountPercent: 100,
  slippagePercent: 0.5,
  enabled,
});

describe('hasAnyEnabledAsset', () => {
  it('returns true when at least one asset is enabled', () => {
    const sendAssetsConfig: SendAssetsConfig = {
      'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48':
        buildAssetConfig(true),
      'eip155:1/erc20:0x6B175474E89094C44Da98b954EedeAC495271d0F':
        buildAssetConfig(false),
    };

    expect(hasAnyEnabledAsset(sendAssetsConfig)).toBe(true);
  });

  it('returns false when all assets are disabled', () => {
    const sendAssetsConfig: SendAssetsConfig = {
      'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48':
        buildAssetConfig(false),
      'eip155:1/erc20:0x6B175474E89094C44Da98b954EedeAC495271d0F':
        buildAssetConfig(false),
    };

    expect(hasAnyEnabledAsset(sendAssetsConfig)).toBe(false);
  });

  it('returns true when all assets are enabled', () => {
    const sendAssetsConfig: SendAssetsConfig = {
      'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48':
        buildAssetConfig(true),
      'eip155:1/erc20:0x6B175474E89094C44Da98b954EedeAC495271d0F':
        buildAssetConfig(true),
    };

    expect(hasAnyEnabledAsset(sendAssetsConfig)).toBe(true);
  });

  it('returns true when only one asset exists and it is enabled', () => {
    const sendAssetsConfig: SendAssetsConfig = {
      'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48':
        buildAssetConfig(true),
    };

    expect(hasAnyEnabledAsset(sendAssetsConfig)).toBe(true);
  });

  it('returns false when only one asset exists and it is disabled', () => {
    const sendAssetsConfig: SendAssetsConfig = {
      'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48':
        buildAssetConfig(false),
    };

    expect(hasAnyEnabledAsset(sendAssetsConfig)).toBe(false);
  });

  it('returns false when sendAssetsConfig is empty', () => {
    const sendAssetsConfig: SendAssetsConfig = {};

    expect(hasAnyEnabledAsset(sendAssetsConfig)).toBe(false);
  });
});
