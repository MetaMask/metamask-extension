import {
  BaseController,
  type ControllerGetStateAction,
  type ControllerStateChangeEvent,
  type RestrictedControllerMessenger,
} from '@metamask/base-controller';
import type { AccountsControllerSetSelectedAccountAction } from '@metamask/accounts-controller';
import type {
  NetworkConfiguration,
  NetworkControllerGetNetworkConfigurationByNetworkClientId,
  NetworkControllerSetActiveNetworkAction,
  NetworkControllerGetStateAction,
  NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';
import type { Draft } from 'immer';

const controllerName = 'MultichainNetworkController';

/**
 * State used by the {@link MultichainNetworkController} to cache network configurations.
 */
export type MultichainNetworkControllerState = {
  multichainNetworkConfigurationsByChainId: Record<string, NetworkConfiguration>;
  multichainSelectedNetworkChainId: string;
  nonEvmSelected: boolean;
};

/**
 * Default state of the {@link MultichainNetworkController}.
 */
export const defaultState: MultichainNetworkControllerState = {
  multichainNetworkConfigurationsByChainId: {
    'bip122:000000000019d6689c085ae165831e93': {
      // @ts-expect-error: We want to use CAIP-2 instead of hex.
      chainId: 'bip122:000000000019d6689c085ae165831e93',
      blockExplorerUrls: [],
      defaultRpcEndpointIndex: 0,
      name: 'Bitcoin Mainnet',
      nativeCurrency: 'BTC',
      rpcEndpoints: [{
        networkClientId: 'random-id-1',
        // @ts-expect-error:just ignore
        type: 'custom',
        url: 'https://random.com',
      }],
    },
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
      // @ts-expect-error: We want to use CAIP-2 instead of hex.
      chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      blockExplorerUrls: [],
      defaultRpcEndpointIndex: 0,
      name: 'Solana Mainnet',
      nativeCurrency: 'SOL',
      rpcEndpoints: [
        {
          networkClientId: 'random-id-2',
          // @ts-expect-error:just ignore
          type: 'custom',
          url: 'https://random.com',
        }
      ],
    },
  },
  multichainSelectedNetworkChainId: 'bip122:000000000019d6689c085ae165831e93',
  nonEvmSelected: false,
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
  multichainNetworkConfigurationsByChainId: { persist: true, anonymous: false },
  multichainSelectedNetworkChainId: { persist: true, anonymous: false },
  nonEvmSelected: { persist: true, anonymous: false },
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
    console.log('start setActiveNetwork in MultichainNetworkController', networkConfigurationId, chainId);
    if (chainId === 'bip122:000000000019d6689c085ae165831e93' || chainId === 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp') {
      console.log(
        'MultichainNetworkController: update network configuration',
        networkConfigurationId,
        chainId,
      );
      this.update((state: Draft<MultichainNetworkControllerState>) => {
        state.multichainSelectedNetworkChainId = chainId;
        state.nonEvmSelected = true;
       });
      return;
    }

    console.log(
      'MultichainNetworkController: update network configuration on NetworkController',
      networkConfigurationId,
      chainId,
    );
    this.update((state: Draft<MultichainNetworkControllerState>) => {
      state.nonEvmSelected = false;
     });
    const _networkConfiguration = await this.messagingSystem.call(
      'NetworkController:getNetworkConfigurationByNetworkClientId',
      networkConfigurationId
    );
    console.log(_networkConfiguration);
    this.messagingSystem.call('NetworkController:setActiveNetwork', networkConfigurationId);
  };


}
