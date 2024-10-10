import { Provider } from '@metamask/network-controller';
import { BaseController, StateMetadata } from '@metamask/base-controller';
import {
  BRIDGE_STATUS_CONTROLLER_NAME,
  DEFAULT_BRIDGE_STATUS_CONTROLLER_STATE,
} from './constants';
import {
  BridgeStatusControllerState,
  BridgeStatusControllerMessenger,
} from './types';
import { dummyFetchBridgeStatus } from './utils';

const metadata: StateMetadata<{
  bridgeStatusState: BridgeStatusControllerState;
}> = {
  bridgeStatusState: {
    persist: false,
    anonymous: false,
  },
};

export default class BridgeStatusController extends BaseController<
  typeof BRIDGE_STATUS_CONTROLLER_NAME,
  { bridgeStatusState: BridgeStatusControllerState },
  BridgeStatusControllerMessenger
> {
  #provider: Provider;

  constructor({
    provider,
    messenger,
  }: {
    provider: Provider;
    messenger: BridgeStatusControllerMessenger;
  }) {
    super({
      name: BRIDGE_STATUS_CONTROLLER_NAME,
      metadata,
      messenger,
      state: { bridgeStatusState: DEFAULT_BRIDGE_STATUS_CONTROLLER_STATE },
    });

    // Register action handlers
    this.messagingSystem.registerActionHandler(
      `${BRIDGE_STATUS_CONTROLLER_NAME}:getBridgeTxStatus`,
      this.getBridgeTxStatus.bind(this),
    );

    // Assign vars
    this.#provider = provider;
  }

  resetState = () => {
    this.update((_state) => {
      _state.bridgeStatusState = {
        ...DEFAULT_BRIDGE_STATUS_CONTROLLER_STATE,
      };
    });
  };

  getBridgeTxStatus = async () => {
    const { bridgeStatusState } = this.state;

    const bridgeStatus = await dummyFetchBridgeStatus();
    this.update((_state) => {
      _state.bridgeStatusState = { ...bridgeStatusState, bridgeStatus };
    });
  };
}
