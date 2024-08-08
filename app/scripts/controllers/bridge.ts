import { ObservableStore } from '@metamask/obs-store';
import { fetchBridgeFeatureFlags } from '../../../ui/pages/bridge/bridge.util';

// Maps to BridgeController function names
export enum BridgeBackgroundAction {
  SET_FEATURE_FLAGS = 'setBridgeFeatureFlags',
}

export enum BridgeFeatureFlagsKey {
  EXTENSION_SUPPORT = 'extensionSupport',
}

export type BridgeFeatureFlags = {
  [BridgeFeatureFlagsKey.EXTENSION_SUPPORT]: boolean;
};

const initialState = {
  bridgeState: {
    bridgeFeatureFlags: {
      [BridgeFeatureFlagsKey.EXTENSION_SUPPORT]: false,
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

  setBridgeFeatureFlags = async () => {
    const { bridgeState } = this.store.getState();
    const bridgeFeatureFlags = await fetchBridgeFeatureFlags();
    this.store.updateState({
      bridgeState: { ...bridgeState, bridgeFeatureFlags },
    });
  };
}
