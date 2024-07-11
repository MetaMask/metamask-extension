import { ObservableStore } from '@metamask/obs-store';

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

  setBridgeFeatureFlags = (bridgeFeatureFlags: BridgeFeatureFlags) => {
    const { bridgeState } = this.store.getState();
    this.store.updateState({
      bridgeState: { ...bridgeState, bridgeFeatureFlags },
    });
  };
}
