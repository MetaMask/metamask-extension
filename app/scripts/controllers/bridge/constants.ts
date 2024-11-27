import { zeroAddress } from 'ethereumjs-util';
import { Hex } from '@metamask/utils';
import {
  BRIDGE_DEFAULT_SLIPPAGE,
  METABRIDGE_ETHEREUM_ADDRESS,
} from '../../../../shared/constants/bridge';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { BridgeControllerState, BridgeFeatureFlagsKey } from './types';

export const BRIDGE_CONTROLLER_NAME = 'BridgeController';
export const REFRESH_INTERVAL_MS = 30 * 1000;
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

export const METABRIDGE_CHAIN_TO_ADDRESS_MAP: Record<Hex, string> = {
  [CHAIN_IDS.MAINNET]: METABRIDGE_ETHEREUM_ADDRESS,
};
