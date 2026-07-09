import type { BridgeToken } from '../bridge/types';

export type BatchSellAsset = BridgeToken & {
  tokenFiatPrice?: number;
  percentageChange?: number;
};
