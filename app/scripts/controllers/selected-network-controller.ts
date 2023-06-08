import EventEmitter from 'events';
import log from 'loglevel';
import {
  EncryptionPublicKeyManager,
  EncryptionPublicKeyParamsMetamask,
} from '@metamask/message-manager';
import { KeyringController } from '@metamask/eth-keyring-controller';
import {
  AbstractMessageManager,
  AbstractMessage,
  MessageManagerState,
  AbstractMessageParams,
  AbstractMessageParamsMetamask,
  OriginalRequest,
} from '@metamask/message-manager/dist/AbstractMessageManager';
import {
  BaseControllerV2,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import { Patch } from 'immer';
import {
  AcceptRequest,
  AddApprovalRequest,
  RejectRequest,
} from '@metamask/approval-controller';
import { MetaMetricsEventCategory } from '../../../shared/constants/metametrics';
import { KeyringType } from '../../../shared/constants/keyring';
import { ORIGIN_METAMASK } from '../../../shared/constants/app';

const controllerName = 'SelectedNetworkController';
const methodNameGetEncryptionPublicKey = 'eth_getEncryptionPublicKey';

const stateMetadata = {
  domains: { persist: true, anonymous: false },
  queue: { persist: false, anonymous: false }
};

const getDefaultState = () => ({
  domains: {},
});

type Domain = string;
type ChainId = string;
type RequestQueue = Record<Domain, Promise<unknown>[]>;

export type SelectedNetworkControllerState = {
  domains: Record<Domain, ChainId>;
};

export type GetSelectedNetworkState = {
  type: `${typeof controllerName}:getState`;
  handler: () => SelectedNetworkControllerState;
};

export type GetSelectedNetworkStateChange = {
  type: `${typeof controllerName}:stateChange`;
  payload: [SelectedNetworkControllerState, Patch[]];
};

export type SelectedNetworkControllerActions = GetSelectedNetworkState;

export type SelectedNetworkControllerEvents =
  GetSelectedNetworkStateChange;

export type SelectedNetworkControllerMessenger =
  RestrictedControllerMessenger<
    typeof controllerName,
    SelectedNetworkControllerActions,
    SelectedNetworkControllerEvents,
    never,
    never
  >;

type SwitchNetwork = (chainId: ChainId) => void;

export type SelectedNetworkControllerOptions = {
  messenger: SelectedNetworkControllerMessenger;
  switchNetwork: SwitchNetwork;
};

/**
 * Controller for requesting encryption public key requests requiring user approval.
 */
export default class SelectedNetworkController extends BaseControllerV2<
  typeof controllerName,
  SelectedNetworkControllerState,
  SelectedNetworkControllerMessenger
> {
  private switchNetwork: SwitchNetwork;
  private requestQueue: RequestQueue = {};
  /**
   * Construct a EncryptionPublicKey controller.
   *
   * @param options - The controller options.
   * @param options.messenger - The restricted controller messenger for the EncryptionPublicKey controller.
   * @param options.keyringController - An instance of a keyring controller used to extract the encryption public key.
   * @param options.getState - Callback to retrieve all user state.
   * @param options.metricsEvent - A function for emitting a metric event.
   */
  constructor({
    messenger,
    switchNetwork,
  }: SelectedNetworkControllerOptions) {
    super({
      name: controllerName,
      metadata: stateMetadata,
      messenger,
      state: getDefaultState(),
    });
    this.switchNetwork = switchNetwork;
  }

  /**
   * Reset the controller state to the initial state.
   */
  resetState() {
    this.update(() => getDefaultState());
  }

  setChainForDomain(origin: Domain, chainId: ChainId) {
    this.update((state) => {
      state.domains[origin] = chainId;
    });
  }

  getChainForDomain(origin: Domain) {
    return this.state.domains[origin];
  }

  hasQueuedRequests(origin?: Domain) {
    if (origin) {
      return this.requestQueue[origin].length > 0;
    }
    return Object.keys(this.requestQueue).length > 0;
  }

  enqueueRequest(origin: Domain, requestNext: Promise<unknown>) {
    if (this.requestQueue[origin] === undefined) {
      this.requestQueue[origin] = [];
    }

    this.requestQueue[origin].push(requestNext);

    return this.requestQueue;
  }

  async waitForRequestQueue() {
    console.log('request queue when starting to wait: ', this.requestQueue)
    const domainQueues = Object.values(
      this.requestQueue
    ).map((domainQueue) => Promise.all(domainQueue))
    await Promise.all(domainQueues);
    this.requestQueue = {};
    return true;
  }
}
