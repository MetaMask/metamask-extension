import {
  BATCH_SELL_ASSET_IDS,
  buildSendAssetConfigEntry,
} from '../../../../../../test/data/batch-sell';
import type { BatchSellQuotesConfig } from '../types';
import { hasAnyEnabledAsset } from './hasAnyEnabledAsset';

type SendAssetsConfig = BatchSellQuotesConfig['sendAssetsConfig'];

const ASSET_ID_A = BATCH_SELL_ASSET_IDS.USDC;
const ASSET_ID_B = BATCH_SELL_ASSET_IDS.DAI;

describe('hasAnyEnabledAsset', () => {
  it('returns true when at least one asset is enabled', () => {
    const sendAssetsConfig: SendAssetsConfig = {
      [ASSET_ID_A]: buildSendAssetConfigEntry(true),
      [ASSET_ID_B]: buildSendAssetConfigEntry(false),
    };

    expect(hasAnyEnabledAsset(sendAssetsConfig)).toBe(true);
  });

  it('returns false when all assets are disabled', () => {
    const sendAssetsConfig: SendAssetsConfig = {
      [ASSET_ID_A]: buildSendAssetConfigEntry(false),
      [ASSET_ID_B]: buildSendAssetConfigEntry(false),
    };

    expect(hasAnyEnabledAsset(sendAssetsConfig)).toBe(false);
  });

  it('returns true when all assets are enabled', () => {
    const sendAssetsConfig: SendAssetsConfig = {
      [ASSET_ID_A]: buildSendAssetConfigEntry(true),
      [ASSET_ID_B]: buildSendAssetConfigEntry(true),
    };

    expect(hasAnyEnabledAsset(sendAssetsConfig)).toBe(true);
  });

  it('returns true when only one asset exists and it is enabled', () => {
    const sendAssetsConfig: SendAssetsConfig = {
      [ASSET_ID_A]: buildSendAssetConfigEntry(true),
    };

    expect(hasAnyEnabledAsset(sendAssetsConfig)).toBe(true);
  });

  it('returns false when only one asset exists and it is disabled', () => {
    const sendAssetsConfig: SendAssetsConfig = {
      [ASSET_ID_A]: buildSendAssetConfigEntry(false),
    };

    expect(hasAnyEnabledAsset(sendAssetsConfig)).toBe(false);
  });

  it('returns false when sendAssetsConfig is empty', () => {
    const sendAssetsConfig: SendAssetsConfig = {};

    expect(hasAnyEnabledAsset(sendAssetsConfig)).toBe(false);
  });
});
