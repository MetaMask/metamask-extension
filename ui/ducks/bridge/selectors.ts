import { NetworkState, ProviderConfig } from '@metamask/network-controller';
import { uniqBy } from 'lodash';
import {
  getAllNetworks,
  getIsBridgeEnabled,
  getSwapsDefaultToken,
  SwapsEthToken,
} from '../../selectors';
import { ALLOWED_BRIDGE_CHAIN_IDS } from '../../../shared/constants/bridge';
import {
  BridgeControllerState,
  BridgeFeatureFlagsKey,
} from '../../../app/scripts/controllers/bridge/types';
import { createDeepEqualSelector } from '../../selectors/util';
import { SwapsTokenObject } from '../../../shared/constants/swaps';
import { BridgeState } from './bridge';

type BridgeAppState = {
  metamask: NetworkState & { bridgeState: BridgeControllerState } & {
    useExternalServices: boolean;
  };
  bridge: BridgeState;
};

export const getAllBridgeableNetworks = createDeepEqualSelector(
  (state: BridgeAppState) =>
    // only includes networks user has added
    getAllNetworks({
      metamask: { networkConfigurations: state.metamask.networkConfigurations },
    }),
  (allNetworks): ProviderConfig[] => {
    return uniqBy([...allNetworks], 'chainId').filter(({ chainId }) =>
      ALLOWED_BRIDGE_CHAIN_IDS.includes(chainId),
    );
  },
);

export const getFromChains = createDeepEqualSelector(
  getAllBridgeableNetworks,
  (state: BridgeAppState) => state.metamask.bridgeState?.bridgeFeatureFlags,
  (allBridgeableNetworks, bridgeFeatureFlags): ProviderConfig[] =>
    allBridgeableNetworks.filter(({ chainId }) =>
      bridgeFeatureFlags[BridgeFeatureFlagsKey.NETWORK_SRC_ALLOWLIST].includes(
        chainId,
      ),
    ),
);

export const getFromChain = createDeepEqualSelector(
  getFromChains,
  (state: BridgeAppState) => state.metamask.providerConfig,
  (fromChains, providerConfig): ProviderConfig =>
    fromChains.find(({ chainId }) => chainId === providerConfig.chainId) ??
    providerConfig,
);

export const getToChains = createDeepEqualSelector(
  getFromChain,
  getAllBridgeableNetworks,
  (state: BridgeAppState) => state.metamask.bridgeState?.bridgeFeatureFlags,
  (fromChain, allBridgeableNetworks, bridgeFeatureFlags): ProviderConfig[] =>
    allBridgeableNetworks.filter(
      ({ chainId }) =>
        chainId !== fromChain.chainId &&
        bridgeFeatureFlags[
          BridgeFeatureFlagsKey.NETWORK_DEST_ALLOWLIST
        ].includes(chainId),
    ),
);

export const getToChain = createDeepEqualSelector(
  getToChains,
  (state: BridgeAppState) => state.bridge.toChainId,
  (toChains, toChainId): ProviderConfig | undefined =>
    toChains.find(({ chainId }) => chainId === toChainId),
);

export const getFromToken = (
  state: BridgeAppState,
): SwapsTokenObject | SwapsEthToken => {
  return state.bridge.fromToken || getSwapsDefaultToken(state);
};

export const getFromTokens = (state: BridgeAppState) => {
  return state.metamask.bridgeState.srcTokens;
};

export const getFromTopAssets = (state: BridgeAppState) => {
  return state.metamask.bridgeState.srcTopAssets;
};

export const getToToken = (
  state: BridgeAppState,
): SwapsTokenObject | SwapsEthToken | undefined => {
  return state.bridge.toToken;
};

export const getToTokens = (state: BridgeAppState) => {
  return state.bridge.toChainId ? state.metamask.bridgeState.destTokens : {};
};

export const getToTopAssets = (state: BridgeAppState) => {
  return state.bridge.toChainId ? state.metamask.bridgeState.destTopAssets : [];
};

export const getFromAmount = (state: BridgeAppState): string | undefined =>
  state.bridge.fromTokenInputValue;

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
    fromChain.chainId !== toChain?.chainId,
);
