import { zeroAddress } from 'ethereumjs-util';
import { BRIDGE_DEFAULT_SLIPPAGE } from '../../../../shared/constants/bridge';
import {
  BridgeState,
  BridgeFeatureFlagsKey,
  BridgeControllerState,
} from '../../../../shared/types/bridge';

export const BRIDGE_CONTROLLER_NAME = 'BridgeController';
export const REFRESH_INTERVAL_MS = 30 * 1000;
const DEFAULT_MAX_REFRESH_COUNT = 5;

export const DEFAULT_BRIDGE_STATE: BridgeState = {
  bridgeFeatureFlags: {
    [BridgeFeatureFlagsKey.EXTENSION_CONFIG]: {
      refreshRate: REFRESH_INTERVAL_MS,
      maxRefreshCount: DEFAULT_MAX_REFRESH_COUNT,
      support: false,
      chains: {},
    },
  },
  srcTokens: {},
  srcTokensLoadingStatus: undefined,
  destTokensLoadingStatus: undefined,
  srcTopAssets: [],
  destTokens: {},
  destTopAssets: [],
  quoteRequest: {
    walletAddress: undefined,
    srcTokenAddress: zeroAddress(),
    slippage: BRIDGE_DEFAULT_SLIPPAGE,
  },
  quotesInitialLoadTime: undefined,
  quotes: [],
  quotesLastFetched: undefined,
  quotesLoadingStatus: undefined,
  quoteFetchError: undefined,
  quotesRefreshCount: 0,
};

export const DEFAULT_BRIDGE_CONTROLLER_STATE: BridgeControllerState = {
  bridgeState: { ...DEFAULT_BRIDGE_STATE },
};
