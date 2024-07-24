import { ObservableStore } from '@metamask/obs-store';
import { fetchBridgeFeatureFlags } from '../../../../ui/pages/bridge/bridge.util';
import { DEFAULT_BRIDGE_CONTROLLER_STATE } from './constants';

export default class BridgeController {
  store = new ObservableStore({ bridgeState: DEFAULT_BRIDGE_CONTROLLER_STATE });

  resetState = () => {
    this.store.updateState({
      bridgeState: {
        ...DEFAULT_BRIDGE_CONTROLLER_STATE,
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
