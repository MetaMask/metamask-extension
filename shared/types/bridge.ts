import { Hex } from '@metamask/utils';
import { SwapsTokenObject } from '../constants/swaps';
import {
  L1GasFees,
  QuoteRequest,
  QuoteResponse,
} from '../../ui/pages/bridge/types';
import { RequestStatus } from '../../app/scripts/controllers/bridge/constants';

export type ChainConfiguration = {
  isActiveSrc: boolean;
  isActiveDest: boolean;
};

export enum BridgeFeatureFlagsKey {
  EXTENSION_CONFIG = 'extensionConfig',
}

export type BridgeFeatureFlags = {
  [BridgeFeatureFlagsKey.EXTENSION_CONFIG]: {
    refreshRate: number;
    maxRefreshCount: number;
    support: boolean;
    chains: { [chainId: Hex]: ChainConfiguration };
  };
};

export type BridgeControllerState = {
  bridgeState: BridgeState;
};

export type BridgeState = {
  bridgeFeatureFlags: BridgeFeatureFlags;
  srcTokens: Record<string, SwapsTokenObject>;
  srcTopAssets: { address: string }[];
  destTokens: Record<string, SwapsTokenObject>;
  destTopAssets: { address: string }[];
  quoteRequest: Partial<QuoteRequest>;
  quotes: (QuoteResponse & L1GasFees)[];
  quotesInitialLoadTime?: number;
  quotesLastFetched?: number;
  quotesLoadingStatus?: RequestStatus;
  quoteFetchError?: string;
  quotesRefreshCount: number;
};

export enum BridgeUserAction {
  SELECT_SRC_NETWORK = 'selectSrcNetwork',
  SELECT_DEST_NETWORK = 'selectDestNetwork',
  UPDATE_QUOTE_PARAMS = 'updateBridgeQuoteRequestParams',
}

export enum BridgeBackgroundAction {
  SET_FEATURE_FLAGS = 'setBridgeFeatureFlags',
  RESET_STATE = 'resetState',
  GET_BRIDGE_ERC20_ALLOWANCE = 'getBridgeERC20Allowance',
}
