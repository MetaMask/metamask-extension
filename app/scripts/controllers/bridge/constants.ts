import { zeroAddress } from 'ethereumjs-util';
import type { Hex } from '@metamask/utils';
import {
  BRIDGE_DEFAULT_SLIPPAGE,
  DEFAULT_MAX_REFRESH_COUNT,
  METABRIDGE_ETHEREUM_ADDRESS,
  REFRESH_INTERVAL_MS,
} from '../../../../shared/constants/bridge';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { BridgeFeatureFlagsKey } from '../../../../shared/types/bridge';
import type { BridgeState } from '../../../../shared/types/bridge';

export const BRIDGE_CONTROLLER_NAME = 'BridgeController';
export const DEFAULT_BRIDGE_STATE: BridgeState = {
  bridgeFeatureFlags: {
    [BridgeFeatureFlagsKey.EXTENSION_CONFIG]: {
      refreshRate: REFRESH_INTERVAL_MS,
      maxRefreshCount: DEFAULT_MAX_REFRESH_COUNT,
      support: false,
      chains: {},
    },
  },
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

export const DEFAULT_BRIDGE_CONTROLLER_STATE = {
  bridgeState: { ...DEFAULT_BRIDGE_STATE },
};

export const METABRIDGE_CHAIN_TO_ADDRESS_MAP: Record<Hex, string> = {
  [CHAIN_IDS.MAINNET]: METABRIDGE_ETHEREUM_ADDRESS,
};
