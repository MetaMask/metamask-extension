import { NetworkState, ProviderConfig } from '@metamask/network-controller';
import { uniqBy } from 'lodash';
import {
  getAllNetworks,
  getCurrentNetwork,
  getIsBridgeEnabled,
  getSwapsDefaultToken,
} from '../../selectors';
import * as swapsSlice from '../swaps/swaps';
import { ALLOWED_BRIDGE_CHAIN_IDS } from '../../../shared/constants/bridge';
import {
  BridgeControllerState,
  BridgeFeatureFlagsKey,
} from '../../../app/scripts/controllers/bridge';
import {
  FEATURED_RPCS,
  RPCDefinition,
} from '../../../shared/constants/network';
import { createDeepEqualSelector } from '../../selectors/util';
import { BridgeState } from './bridge';

// TODO add swaps state
type BridgeAppState = {
  metamask: NetworkState & { bridgeState: BridgeControllerState } & {
    useExternalServices: boolean;
  };
  bridge: BridgeState;
};

export const getFromChain = (state: BridgeAppState): ProviderConfig =>
  getCurrentNetwork(state);
export const getToChain = (state: BridgeAppState): ProviderConfig | null =>
  state.bridge.toChain;

export const getAllBridgeableNetworks = createDeepEqualSelector(
  (state: BridgeAppState) =>
    // includes networks user has added
    getAllNetworks({
      metamask: { networkConfigurations: state.metamask.networkConfigurations },
    }),
  (allNetworks): (ProviderConfig | RPCDefinition)[] => {
    return uniqBy([...allNetworks, ...FEATURED_RPCS], 'chainId').filter(
      ({ chainId }) => ALLOWED_BRIDGE_CHAIN_IDS.includes(chainId),
    );
  },
);
export const getFromChains = createDeepEqualSelector(
  getAllBridgeableNetworks,
  (state: BridgeAppState) => state.metamask.bridgeState?.bridgeFeatureFlags,
  (
    allBridgeableNetworks,
    bridgeFeatureFlags,
  ): (ProviderConfig | RPCDefinition)[] =>
    allBridgeableNetworks.filter(({ chainId }) =>
      bridgeFeatureFlags[BridgeFeatureFlagsKey.NETWORK_SRC_ALLOWLIST].includes(
        chainId,
      ),
    ),
);
export const getToChains = createDeepEqualSelector(
  getAllBridgeableNetworks,
  (state: BridgeAppState) => state.metamask.bridgeState?.bridgeFeatureFlags,
  (
    allBridgeableNetworks,
    bridgeFeatureFlags,
  ): (ProviderConfig | RPCDefinition)[] =>
    allBridgeableNetworks.filter(({ chainId }) =>
      bridgeFeatureFlags[BridgeFeatureFlagsKey.NETWORK_DEST_ALLOWLIST].includes(
        chainId,
      ),
    ),
);

export const getFromToken = (state: BridgeAppState) => {
  const swapsFromToken = swapsSlice.getFromToken(state);
  if (!swapsFromToken?.address) {
    return getSwapsDefaultToken(state);
  }
  return swapsFromToken;
};
export const getFromTokens = (state: BridgeAppState) => {
  return state.metamask.bridgeState.srcTokens;
};
export const getFromTopAssets = (state: BridgeAppState) => {
  return state.metamask.bridgeState.srcTopAssets;
};

export const getToToken = (state: BridgeAppState) => {
  return swapsSlice.getToToken(state);
};
export const getToTokens = (state: BridgeAppState) => {
  return state.bridge.toChain ? state.metamask.bridgeState.destTokens : {};
};
export const getToTopAssets = (state: BridgeAppState) => {
  return state.bridge.toChain ? state.metamask.bridgeState.destTopAssets : [];
};

export const getFromAmount = (state: BridgeAppState) =>
  swapsSlice.getFromTokenInputValue(state);
export const getToAmount = (_state: BridgeAppState) => {
  return '0';
};

export const getIsBridgeTx = createDeepEqualSelector(
  getFromChain,
  getToChain,
  (state: BridgeAppState) => getIsBridgeEnabled(state),
  (fromChain, toChain, isBridgeEnabled: boolean) =>
    isBridgeEnabled &&
    toChain !== null &&
    fromChain.chainId !== toChain.chainId,
);
