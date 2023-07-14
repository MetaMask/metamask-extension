import {
  BaseControllerV2,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import { Patch } from 'immer';
import {
  createEventEmitterProxy,
  createSwappableProxy,
} from '@metamask/swappable-obj-proxy';
import { NetworkClient } from '@metamask/network-controller';

const controllerName = 'SelectedNetworkController';
const stateMetadata = {
  domains: { persist: true, anonymous: false },
  queue: { persist: false, anonymous: false },
};

const getDefaultState = () => ({
  domains: {},
});

type Domain = string;
type ChainId = `0x${string}`;
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

export type GetClientForDomain = {
  type: `SelectedNetworkController:getClientForDomain`;
  handler: (origin: string) => NetworkClient;
};

export type GetChainForDomain = {
  type: `SelectedNetworkController:getChainForDomain`;
  handler: (origin: string) => `0x${string}`;
};

export type SelectedNetworkControllerActions =
  | GetSelectedNetworkState
  | GetClientForDomain
  | GetChainForDomain;

export type SelectedNetworkControllerEvents = GetSelectedNetworkStateChange;

export type SelectedNetworkControllerMessenger = RestrictedControllerMessenger<
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

  private clientsByDomain: Record<string, any> = {};

  /**
   * Construct a SelectedNetworkController controller.
   *
   * @param options - The controller options.
   * @param options.messenger - The restricted controller messenger for the EncryptionPublicKey controller.
   * @param options.switchNetwork - A function for switching the current network.
   */
  constructor({ messenger, switchNetwork }: SelectedNetworkControllerOptions) {
    super({
      name: controllerName,
      metadata: stateMetadata,
      messenger,
      state: getDefaultState(),
    });
    this.switchNetwork = switchNetwork;
    this.clientsByDomain = {};
    this.registerMessageHandlers();
  }

  private registerMessageHandlers(): void {
    this.messagingSystem.registerActionHandler(
      `${controllerName}:getClientForDomain` as const,
      this.getClientForDomain.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      `${controllerName}:getChainForDomain` as const,
      this.getChainForDomain.bind(this),
    );
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

  setClientForDomain(origin: Domain, client: any) {
    if (this.clientsByDomain[origin] !== undefined) {
      this.clientsByDomain[origin].provider.setTarget(client.provider);
      this.clientsByDomain[origin].blockTracker.setTarget(client.blockTracker);
      this.clientsByDomain[origin].configuration.setTarget(
        client.configuration,
      );
      return;
    }
    this.clientsByDomain[origin] = {
      configuration: createSwappableProxy(client.configuration),
      provider: createEventEmitterProxy(client.provider),
      blockTracker: createEventEmitterProxy(client.blockTracker, {
        eventFilter: 'skipInternal',
      }),
    };
  }

  getClientForDomain(origin: Domain) {
    return this.clientsByDomain[origin];
  }

  getChainForDomain(origin: Domain) {
    return this.state.domains[origin];
  }

  getAllConfigurationsByChainId() {
    return this.clientsByDomain.reduce(
      (acc: Record<ChainId, any>, client: any) => {
        acc[client.configuration.chainId] = client.configuration;
        return acc;
      },
      {},
    );
  }

  // hasQueuedRequests(origin?: Domain) {
  //   if (origin) {
  //     return this.requestQueue[origin].length > 0;
  //   }
  //   return Object.keys(this.requestQueue).length > 0;
  // }

  // enqueueRequest(origin: Domain, requestNext: Promise<unknown>) {
  //   if (this.requestQueue[origin] === undefined) {
  //     this.requestQueue[origin] = [];
  //   }

  //   this.requestQueue[origin].push(requestNext);

  //   return this.requestQueue;
  // }

  // async waitForRequestQueue() {
  //   console.log('request queue when starting to wait: ', this.requestQueue);
  //   const domainQueues = Object.values(this.requestQueue).map((domainQueue) =>
  //     Promise.all(domainQueue),
  //   );
  //   await Promise.all(domainQueues);
  //   this.requestQueue = {};
  //   return true;
  // }
}
