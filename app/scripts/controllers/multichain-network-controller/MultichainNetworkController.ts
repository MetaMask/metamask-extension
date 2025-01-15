import {
  BaseController,
  type ControllerGetStateAction,
  type ControllerStateChangeEvent,
  type RestrictedControllerMessenger,
} from '@metamask/base-controller';
import type { AccountsControllerSetSelectedAccountAction } from '@metamask/accounts-controller';
import type {
  NetworkControllerGetNetworkConfigurationByNetworkClientId,
  NetworkControllerSetActiveNetworkAction,
  NetworkControllerGetStateAction,
  NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';
import type { Draft } from 'immer';

import { BITCOIN_TOKEN_IMAGE_URL, SOLANA_TOKEN_IMAGE_URL } from '../../../../shared/constants/multichain/networks';

const controllerName = 'MultichainNetworkController';

export type NetworkConfiguration = {
  chainId: string;
  isEvm: boolean;
  metadata: {
    logo: string;
    name: string;
  }
};

/**
 * State used by the {@link MultichainNetworkController} to cache network configurations.
 */
export type MultichainNetworkControllerState = {
  networks: Record<string, NetworkConfiguration>;
  activeNetwork: string;
};

/**
 * Default state of the {@link MultichainNetworkController}.
 */
export const defaultState: MultichainNetworkControllerState = {
  networks: {
    'bip122:000000000019d6689c085ae165831e93': {
      chainId: 'bip122:000000000019d6689c085ae165831e93',
      isEvm: false,
      metadata: {
        logo: BITCOIN_TOKEN_IMAGE_URL,
        name: 'Bitcoin',

      }
    },
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
      chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      isEvm: false,
      metadata: {
        logo: SOLANA_TOKEN_IMAGE_URL,
        name: 'Solana',
      }
    },
  },
  activeNetwork: 'bip122:000000000019d6689c085ae165831e93',
};

/**
 * Returns the state of the {@link MultichainNetworkController}.
 */
export type MultichainNetworkControllerGetStateAction = ControllerGetStateAction<
  typeof controllerName,
  MultichainNetworkControllerState
>;

/**
 * Event emitted when the state of the {@link MultichainNetworkController} changes.
 */
export type MultichainNetworkStateControllerStateChange = ControllerStateChangeEvent<
  typeof controllerName,
  MultichainNetworkControllerState
>;

/**
 * Actions exposed by the {@link MultichainNetworkController}.
 */
export type MultichainNetworkStateControllerActions =
  | MultichainNetworkControllerGetStateAction

/**
 * Events emitted by {@link MultichainNetworkController}.
 */
export type MultichainNetworkControllerEvents = MultichainNetworkStateControllerStateChange;

/**
 * Actions that this controller is allowed to call.
 */
export type AllowedActions =
  | NetworkControllerGetStateAction
  | NetworkControllerSetActiveNetworkAction
  | AccountsControllerSetSelectedAccountAction
  | NetworkControllerGetNetworkConfigurationByNetworkClientId;

/**
 * Events that this controller is allowed to subscribe.
 */
export type AllowedEvents = NetworkControllerStateChangeEvent;

/**
 * Messenger type for the MultichainNetworkController.
 */
export type MultichainNetworkControllerMessenger = RestrictedControllerMessenger<
  typeof controllerName,
  MultichainNetworkStateControllerActions | AllowedActions,
  MultichainNetworkControllerEvents | AllowedEvents,
  AllowedActions['type'],
  AllowedEvents['type']
>;

/**
 * {@link MultichainNetworkController}'s metadata.
 *
 * This allows us to choose if fields of the state should be persisted or not
 * using the `persist` flag; and if they can be sent to Sentry or not, using
 * the `anonymous` flag.
 */
const multichainNetworkControllerMetadata = {
  networks: { persist: true, anonymous: false },
  activeNetwork: { persist: true, anonymous: false },
};

/**
 * The MultichainNetworkController is responsible for fetching and caching account
 * balances.
 */
export class MultichainNetworkController extends BaseController<
  typeof controllerName,
  MultichainNetworkControllerState,
  MultichainNetworkControllerMessenger
> {

  constructor({
    messenger,
    state,
  }: {
    messenger: MultichainNetworkControllerMessenger;
    state: MultichainNetworkControllerState;
  }) {
    super({
      messenger,
      name: controllerName,
      metadata: multichainNetworkControllerMetadata,
      state: {
        ...defaultState,
        ...state,
      },
    });
  }

  async setActiveNetwork(networkConfigurationId: string, chainId?: string): Promise<void> {
    console.log('setActiveNetwork in MultichainNetworkController', networkConfigurationId, chainId);
    if (chainId) {
      this.update((state: Draft<MultichainNetworkControllerState>) => {
        state.activeNetwork = chainId;
       });
      return;
    }

    const _networkConfiguration = await this.messagingSystem.call(
      'NetworkController:getNetworkConfigurationByNetworkClientId',
      networkConfigurationId
    );
    console.log(_networkConfiguration);
    this.messagingSystem.call('NetworkController:setActiveNetwork', networkConfigurationId);
  };


}
