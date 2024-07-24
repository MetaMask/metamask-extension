import { BaseController, StateMetadata } from '@metamask/base-controller';
import { fetchBridgeFeatureFlags } from '../../../../ui/pages/bridge/bridge.util';
import {
  BRIDGE_CONTROLLER_NAME,
  DEFAULT_BRIDGE_CONTROLLER_STATE,
} from './constants';
import { BridgeControllerState, BridgeControllerMessenger } from './types';

const metadata: StateMetadata<{ bridgeState: BridgeControllerState }> = {
  bridgeState: {
    persist: false,
    anonymous: false,
  },
};

export default class BridgeController extends BaseController<
  typeof BRIDGE_CONTROLLER_NAME,
  { bridgeState: BridgeControllerState },
  BridgeControllerMessenger
> {
  constructor({ messenger }: { messenger: BridgeControllerMessenger }) {
    super({
      name: BRIDGE_CONTROLLER_NAME,
      metadata,
      messenger,
      state: { bridgeState: DEFAULT_BRIDGE_CONTROLLER_STATE },
    });

    this.messagingSystem.registerActionHandler(
      `${BRIDGE_CONTROLLER_NAME}:setBridgeFeatureFlags`,
      this.setBridgeFeatureFlags.bind(this),
    );
  }

  resetState = () => {
    this.update((_state) => {
      _state.bridgeState = {
        ...DEFAULT_BRIDGE_CONTROLLER_STATE,
      };
    });
  };

  setBridgeFeatureFlags = async () => {
    const { bridgeState } = this.state;
    const bridgeFeatureFlags = await fetchBridgeFeatureFlags();
    this.update((_state) => {
      _state.bridgeState = { ...bridgeState, bridgeFeatureFlags };
    });
  };
}
