import { StateMetadata } from '@metamask/base-controller';
import { StaticIntervalPollingController } from '@metamask/polling-controller';
import { Numeric } from '../../../../shared/modules/Numeric';
import {
  BRIDGE_STATUS_CONTROLLER_NAME,
  DEFAULT_BRIDGE_STATUS_CONTROLLER_STATE,
  REFRESH_INTERVAL_MS,
} from './constants';
import {
  BridgeStatusControllerState,
  BridgeStatusControllerMessenger,
  StatusRequest,
  StatusTypes,
} from './types';
import { fetchBridgeTxStatus } from './utils';

const metadata: StateMetadata<{
  bridgeStatusState: BridgeStatusControllerState;
}> = {
  bridgeStatusState: {
    persist: false,
    anonymous: false,
  },
};

type TxHash = string;

export default class BridgeStatusController extends StaticIntervalPollingController<
  typeof BRIDGE_STATUS_CONTROLLER_NAME,
  { bridgeStatusState: BridgeStatusControllerState },
  BridgeStatusControllerMessenger
> {
  #pollingTokensByTxHash: Record<TxHash, string> = {};

  constructor({ messenger }: { messenger: BridgeStatusControllerMessenger }) {
    super({
      name: BRIDGE_STATUS_CONTROLLER_NAME,
      metadata,
      messenger,
      state: { bridgeStatusState: DEFAULT_BRIDGE_STATUS_CONTROLLER_STATE },
    });

    // Register action handlers
    this.messagingSystem.registerActionHandler(
      `${BRIDGE_STATUS_CONTROLLER_NAME}:startPollingForBridgeTxStatus`,
      this.startPollingForBridgeTxStatus.bind(this),
    );

    // Set interval
    this.setIntervalLength(REFRESH_INTERVAL_MS);
  }

  resetState = () => {
    this.update((_state) => {
      _state.bridgeStatusState = {
        ...DEFAULT_BRIDGE_STATUS_CONTROLLER_STATE,
      };
    });
  };

  startPollingForBridgeTxStatus = async (statusRequest: StatusRequest) => {
    // Need to subscribe since if we try to fetch status too fast, API will fail with 500 error
    // So fetch on tx confirmed
    this.messagingSystem.subscribe(
      'TransactionController:transactionConfirmed',
      async (txMeta) => {
        if (txMeta.hash === statusRequest.srcTxHash) {
          const hexSourceChainId = new Numeric(statusRequest.srcChainId, 10)
            .toPrefixedHexString()
            .toLowerCase() as `0x${string}`;

          const networkClientId = this.messagingSystem.call(
            'NetworkController:findNetworkClientIdByChainId',
            hexSourceChainId,
          );
          this.#pollingTokensByTxHash[statusRequest.srcTxHash] =
            this.startPollingByNetworkClientId(networkClientId, statusRequest);
        }
      },
    );
  };

  // This will be called after you call this.startPollingByNetworkClientId()
  _executePoll = async (
    _networkClientId: string,
    statusRequest: StatusRequest,
  ) => {
    await this.#fetchBridgeTxStatus(statusRequest);
  };

  #fetchBridgeTxStatus = async (statusRequest: StatusRequest) => {
    const { bridgeStatusState } = this.state;
    const bridgeTxStatus = await fetchBridgeTxStatus(statusRequest);

    // No need to purge these on network change or account change, TransactionController does not purge either.
    // TODO In theory we can skip checking status if it's not the current account/network
    // we need to keep track of the account that this is associated with as well so that we don't show it in Activity list for other accounts
    // First stab at this will not stop polling when you are on a different account
    this.update((_state) => {
      _state.bridgeStatusState = {
        ...bridgeStatusState,
        txStatuses: {
          ...bridgeStatusState.txStatuses,
          [statusRequest.srcTxHash]: bridgeTxStatus,
        },
      };
    });

    const pollingToken = this.#pollingTokensByTxHash[statusRequest.srcTxHash];
    if (bridgeTxStatus.status === StatusTypes.COMPLETE && pollingToken) {
      this.stopPollingByPollingToken(pollingToken);
    }
  };
}
