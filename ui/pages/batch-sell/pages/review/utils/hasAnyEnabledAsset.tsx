import { BatchSellQuotesConfig } from '../types';

export const hasAnyEnabledAsset = (
  sendAssetsConfig: BatchSellQuotesConfig['sendAssetsConfig'],
) => {
  return Object.values(sendAssetsConfig).some((config) => config.enabled);
};
