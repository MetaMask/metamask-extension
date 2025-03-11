import {
  ControllerStateChangeEvent,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import { Hex } from '@metamask/utils';
import { SwapsTokenObject } from '../../../../shared/constants/swaps';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { QuoteRequest } from '../../../../ui/pages/bridge/types';
import BridgeController from './bridge-controller';
import { BRIDGE_CONTROLLER_NAME } from './constants';

export enum BridgeFeatureFlagsKey {
  EXTENSION_CONFIG = 'extensionConfig',
  EXTENSION_SUPPORT = 'extensionSupport',
  NETWORK_SRC_ALLOWLIST = 'srcNetworkAllowlist',
  NETWORK_DEST_ALLOWLIST = 'destNetworkAllowlist',
}

export type BridgeFeatureFlags = {
  [BridgeFeatureFlagsKey.EXTENSION_CONFIG]: {
    refreshRate: number;
    maxRefreshCount: number;
  };
  [BridgeFeatureFlagsKey.EXTENSION_SUPPORT]: boolean;
  [BridgeFeatureFlagsKey.NETWORK_SRC_ALLOWLIST]: Hex[];
  [BridgeFeatureFlagsKey.NETWORK_DEST_ALLOWLIST]: Hex[];
};

export type BridgeControllerState = {
  bridgeFeatureFlags: BridgeFeatureFlags;
  srcTokens: Record<string, SwapsTokenObject>;
  srcTopAssets: { address: string }[];
  destTokens: Record<string, SwapsTokenObject>;
  destTopAssets: { address: string }[];
  quoteRequest: Partial<QuoteRequest>;
};

export enum BridgeUserAction {
  SELECT_SRC_NETWORK = 'selectSrcNetwork',
  SELECT_DEST_NETWORK = 'selectDestNetwork',
  UPDATE_QUOTE_PARAMS = 'updateBridgeQuoteRequestParams',
}
export enum BridgeBackgroundAction {
  SET_FEATURE_FLAGS = 'setBridgeFeatureFlags',
}

type BridgeControllerAction<FunctionName extends keyof BridgeController> = {
  type: `${typeof BRIDGE_CONTROLLER_NAME}:${FunctionName}`;
  handler: BridgeController[FunctionName];
};

// Maps to BridgeController function names
type BridgeControllerActions =
  | BridgeControllerAction<BridgeBackgroundAction.SET_FEATURE_FLAGS>
  | BridgeControllerAction<BridgeUserAction.SELECT_SRC_NETWORK>
  | BridgeControllerAction<BridgeUserAction.SELECT_DEST_NETWORK>
  | BridgeControllerAction<BridgeUserAction.UPDATE_QUOTE_PARAMS>;

type BridgeControllerEvents = ControllerStateChangeEvent<
  typeof BRIDGE_CONTROLLER_NAME,
  BridgeControllerState
>;

/**
 * The messenger for the BridgeController.
 */
export type BridgeControllerMessenger = RestrictedControllerMessenger<
  typeof BRIDGE_CONTROLLER_NAME,
  BridgeControllerActions,
  BridgeControllerEvents,
  never,
  never
>;
