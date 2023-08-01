import {
  BaseControllerV2,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';
import { Patch } from 'immer';
import {
  createEventEmitterProxy,
  createSwappableProxy,
} from '@metamask/swappable-obj-proxy';
import {
  NetworkClientId,
  NetworkControllerStateChangeEvent,
  NetworkState,
} from '@metamask/network-controller';

const controllerName = 'SelectedNetworkController';
const stateMetadata = {
  domains: { persist: true, anonymous: false },
  perDomainNetwork: { persist: true, anonymous: false },
};

const getDefaultState = () => ({
  domains: {},
  perDomainNetwork: false,
});

type Domain = string;

const METAMASK_DOMAIN = 'metamask' as const;

export type SelectedNetworkControllerState = {
  domains: Record<Domain, NetworkClientId>;
  // Feature flag to start returning networkClientId based on the domain.
  // when the flag is false, the 'metamask' domain will always be used.
  // defaults to false
  perDomainNetwork: boolean;
};

export type GetSelectedNetworkState = {
  type: `${typeof controllerName}:getState`;
  handler: () => SelectedNetworkControllerState;
};

export type GetSelectedNetworkStateChange = {
  type: `${typeof controllerName}:stateChange`;
  payload: [SelectedNetworkControllerState, Patch[]];
};

export type GetNetworkClientIdChainForDomain = {
  type: `SelectedNetworkController:getNetworkClientIdForDomain`;
  handler: (domain: string) => NetworkClientId;
};

export type SetNetworkClientIdChainForDomain = {
  type: `SelectedNetworkController:setNetworkClientIdForDomain`;
  handler: (domain: string, NetworkClientId: NetworkClientId) => void;
};

export type SelectedNetworkControllerActions =
  | GetSelectedNetworkState
  | GetNetworkClientIdChainForDomain
  | SetNetworkClientIdChainForDomain;

export type SelectedNetworkControllerEvents = GetSelectedNetworkStateChange;

export type SelectedNetworkControllerMessenger = RestrictedControllerMessenger<
  typeof controllerName,
  SelectedNetworkControllerActions,
  NetworkControllerStateChangeEvent | SelectedNetworkControllerEvents,
  never,
  NetworkControllerStateChangeEvent['type']
>;

export type SelectedNetworkControllerOptions = {
  messenger: SelectedNetworkControllerMessenger;
};

/**
 * Controller for getting and setting the network for a particular domain.
 */
export default class SelectedNetworkController extends BaseControllerV2<
  typeof controllerName,
  SelectedNetworkControllerState,
  SelectedNetworkControllerMessenger
> {
  /**
   * Construct a SelectedNetworkController controller.
   *
   * @param options - The controller options.
   * @param options.messenger - The restricted controller messenger for the EncryptionPublicKey controller.
   */
  constructor({ messenger }: SelectedNetworkControllerOptions) {
    super({
      name: controllerName,
      metadata: stateMetadata,
      messenger,
      state: getDefaultState(),
    });
    this.registerMessageHandlers();
  }

  private registerMessageHandlers(): void {
    this.messagingSystem.registerActionHandler(
      `${controllerName}:getNetworkClientIdForDomain` as const,
      this.getNetworkClientIdForDomain.bind(this),
    );

    this.messagingSystem.registerActionHandler(
      `${controllerName}:setNetworkClientIdForDomain` as const,
      this.setNetworkClientIdForDomain.bind(this),
    );

    // subscribe to networkController statechange:: selectedNetworkClientId changed
    // update the value for the domain 'metamask'
    this.messagingSystem.subscribe(
      'NetworkController:stateChange',
      (state: NetworkState, patch: Patch[]) => {
        const isChangingNetwork = patch.find(
          (p) => p.path[0] === 'selectedNetworkClientId',
        );
        if (!isChangingNetwork) {
          return;
        }

        // set it for the 'global' network to preserve functionality for the
        // selectedNetworkController.perDomainNetwork feature flag being off
        this.setNetworkClientIdForMetamask(state.selectedNetworkClientId);
      },
    );
  }

  /**
   * Reset the controller state to the initial state.
   */
  resetState() {
    this.update(() => getDefaultState());
  }

  setNetworkClientIdForMetamask(networkClientId: NetworkClientId) {
    return this.setNetworkClientIdForDomain(METAMASK_DOMAIN, networkClientId);
  }

  setNetworkClientIdForDomain(
    domain: Domain,
    networkClientId: NetworkClientId,
  ) {
    this.update((state) => {
      state.domains[domain] = networkClientId;
    });
  }

  getNetworkClientIdForDomain(domain: Domain) {
    if (this.state.perDomainNetwork === true) {
      return this.state.domains[domain];
    }
    return this.state.domains[METAMASK_DOMAIN];
  }
}
