import { NetworkState, ProviderConfig } from '@metamask/network-controller';
import { uniqBy } from 'lodash';
import {
  getAllNetworks,
  getCurrentNetwork,
  getIsBridgeEnabled,
} from '../../selectors';
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

export const getIsBridgeTx = createDeepEqualSelector(
  getFromChain,
  getToChain,
  (state: BridgeAppState) => getIsBridgeEnabled(state),
  (fromChain, toChain, isBridgeEnabled: boolean) =>
    isBridgeEnabled &&
    toChain !== null &&
    fromChain.chainId !== toChain.chainId,
);
