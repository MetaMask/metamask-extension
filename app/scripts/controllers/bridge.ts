import { ObservableStore } from '@metamask/obs-store';
import { Hex } from '@metamask/utils';

export enum BridgeFeatureFlagsKey {
  EXTENSION_SUPPORT = 'extensionSupport',
  NETWORK_SRC_ALLOWLIST = 'srcNetworkAllowlist',
  NETWORK_DEST_ALLOWLIST = 'destNetworkAllowlist',
}

export type BridgeFeatureFlags = {
  [BridgeFeatureFlagsKey.EXTENSION_SUPPORT]: boolean;
  [BridgeFeatureFlagsKey.NETWORK_SRC_ALLOWLIST]: Hex[];
  [BridgeFeatureFlagsKey.NETWORK_DEST_ALLOWLIST]: Hex[];
};

const initialState = {
  bridgeState: {
    bridgeFeatureFlags: {
      [BridgeFeatureFlagsKey.EXTENSION_SUPPORT]: false,
      [BridgeFeatureFlagsKey.NETWORK_SRC_ALLOWLIST]: [],
      [BridgeFeatureFlagsKey.NETWORK_DEST_ALLOWLIST]: [],
    },
  },
};

export default class BridgeController {
  store = new ObservableStore(initialState);

  resetState = () => {
    this.store.updateState({
      bridgeState: {
        ...initialState.bridgeState,
      },
    });
  };

  setBridgeFeatureFlags = (bridgeFeatureFlags: BridgeFeatureFlags) => {
    const { bridgeState } = this.store.getState();
    this.store.updateState({
      bridgeState: { ...bridgeState, bridgeFeatureFlags },
    });
  };
}
