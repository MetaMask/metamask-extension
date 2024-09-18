import { zeroAddress } from 'ethereumjs-util';
import { BridgeControllerState, BridgeFeatureFlagsKey } from './types';

export const BRIDGE_CONTROLLER_NAME = 'BridgeController';
export const REFRESH_INTERVAL_MS = 30 * 1000;
const DEFAULT_SLIPPAGE = 0.5;
const DEFAULT_MAX_REFRESH_COUNT = 5;

export enum RequestStatus {
  LOADING,
  FETCHED,
  ERROR,
}

export const DEFAULT_BRIDGE_CONTROLLER_STATE: BridgeControllerState = {
  bridgeFeatureFlags: {
    [BridgeFeatureFlagsKey.EXTENSION_CONFIG]: {
      refreshRate: REFRESH_INTERVAL_MS,
      maxRefreshCount: DEFAULT_MAX_REFRESH_COUNT,
    },
    [BridgeFeatureFlagsKey.EXTENSION_SUPPORT]: false,
    [BridgeFeatureFlagsKey.NETWORK_SRC_ALLOWLIST]: [],
    [BridgeFeatureFlagsKey.NETWORK_DEST_ALLOWLIST]: [],
  },
  srcTokens: {},
  srcTopAssets: [],
  destTokens: {},
  destTopAssets: [],
  quotes: [],
  quoteRequest: {
    walletAddress: undefined,
    srcTokenAddress: zeroAddress(),
    slippage: DEFAULT_SLIPPAGE,
  },
  quotesLastFetched: undefined,
  quotesLoadingStatus: undefined,
};
