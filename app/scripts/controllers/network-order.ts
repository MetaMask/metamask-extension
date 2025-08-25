import { BtcScope, SolScope } from '@metamask/keyring-api';
import { BaseController, RestrictedMessenger } from '@metamask/base-controller';
import {
  isCaipChainId,
  KnownCaipNamespace,
  parseCaipChainId,
} from '@metamask/utils';
import {
  NetworkControllerSetActiveNetworkAction,
  NetworkControllerStateChangeEvent,
  NetworkState,
  NetworkControllerNetworkRemovedEvent,
  NetworkControllerGetStateAction,
} from '@metamask/network-controller';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import type { CaipChainId, CaipNamespace, Hex } from '@metamask/utils';
import type { Patch } from 'immer';
import { CHAIN_IDS, TEST_CHAINS } from '../../../shared/constants/network';

// Unique name for the controller
const controllerName = 'NetworkOrderController';

/**
 * Information about an ordered network.
 */
export type NetworksInfo = {
  networkId: CaipChainId; // The network's chain id
};

export type EnabledNetworksByChainId = Record<
  CaipNamespace,
  Record<string, boolean>
>;

// State shape for NetworkOrderController
export type NetworkOrderControllerState = {
  orderedNetworkList: NetworksInfo[];
  enabledNetworkMap: EnabledNetworksByChainId;
};

// Describes the structure of a state change event
export type NetworkOrderStateChange = {
  type: `${typeof controllerName}:stateChange`;
  payload: [NetworkOrderControllerState, Patch[]];
};

// Describes the action for updating the networks list
export type NetworkOrderControllerupdateNetworksListAction = {
  type: `${typeof controllerName}:updateNetworksList`;
  handler: NetworkOrderController['updateNetworksList'];
};

// Union of all possible actions for the messenger
export type NetworkOrderControllerMessengerActions =
  NetworkOrderControllerupdateNetworksListAction;

type AllowedActions =
  | NetworkControllerGetStateAction
  | NetworkControllerSetActiveNetworkAction;

// Type for the messenger of NetworkOrderController
export type NetworkOrderControllerMessenger = RestrictedMessenger<
  typeof controllerName,
  NetworkOrderControllerMessengerActions | AllowedActions,
  | NetworkOrderStateChange
  | NetworkControllerStateChangeEvent
  | NetworkControllerNetworkRemovedEvent,
  AllowedActions['type'],
  | NetworkOrderStateChange['type']
  | NetworkControllerStateChangeEvent['type']
  | NetworkControllerNetworkRemovedEvent['type']
>;

// Default state for the controller
const defaultState: NetworkOrderControllerState = {
  orderedNetworkList: [],
  enabledNetworkMap: {
    [KnownCaipNamespace.Eip155]: {
      [CHAIN_IDS.MAINNET]: true,
      [CHAIN_IDS.LINEA_MAINNET]: true,
      [CHAIN_IDS.BASE]: true,
    },
    [KnownCaipNamespace.Solana]: {
      [SolScope.Mainnet]: true,
    },
  },
};

// Metadata for the controller state
const metadata = {
  orderedNetworkList: {
    persist: true,
    anonymous: true,
  },
  enabledNetworkMap: {
    persist: true,
    anonymous: true,
  },
};

/**
 * Controller that updates the order of the network list.
 * This controller subscribes to network state changes and ensures
 * that the network list is updated based on the latest network configurations.
 */
export class NetworkOrderController extends BaseController<
  typeof controllerName,
  NetworkOrderControllerState,
  NetworkOrderControllerMessenger
> {
  /**
   * Creates a NetworkOrderController instance.
   *
   * @param args - The arguments to this function.
   * @param args.messenger - Messenger used to communicate with BaseV2 controller.
   * @param args.state - Initial state to set on this controller.
   */
  constructor({
    messenger,
    state,
  }: {
    messenger: NetworkOrderControllerMessenger;
    state?: NetworkOrderControllerState;
  }) {
    // Call the constructor of BaseControllerV2
    super({
      messenger,
      metadata,
      name: controllerName,
      state: { ...defaultState, ...state },
    });

    // Subscribe to network state changes
    this.messagingSystem.subscribe(
      'NetworkController:stateChange',
      (networkControllerState) => {
        this.onNetworkControllerStateChange(networkControllerState);
      },
    );

    this.messagingSystem.subscribe(
      'NetworkController:networkRemoved',
      (removedNetwork) => {
        this.onNetworkRemoved(removedNetwork.chainId);
      },
    );
  }

  /**
   * Handles the state change of the network controller and updates the networks list.
   *
   * @param networkControllerState - The state of the network controller.
   * @param networkControllerState.networkConfigurationsByChainId
   */
  onNetworkControllerStateChange({
    networkConfigurationsByChainId,
  }: NetworkState) {
    this.update((state) => {
      // Filter out testnets, which are in the state but not orderable
      const hexChainIds = Object.keys(networkConfigurationsByChainId).filter(
        (chainId) =>
          !TEST_CHAINS.includes(chainId as (typeof TEST_CHAINS)[number]),
      ) as Hex[];
      const chainIds: CaipChainId[] = hexChainIds.map(toEvmCaipChainId);
      const nonEvmChainIds: CaipChainId[] = [
        BtcScope.Mainnet,
        SolScope.Mainnet,
      ];

      const newNetworks = chainIds
        .filter(
          (chainId) =>
            !state.orderedNetworkList.some(
              ({ networkId }) => networkId === chainId,
            ),
        )
        .map((chainId) => ({ networkId: chainId }));

      state.orderedNetworkList = state.orderedNetworkList
        // Filter out deleted networks
        .filter(
          ({ networkId }) =>
            chainIds.includes(networkId) ||
            // Since Bitcoin and Solana are not part of the @metamask/network-controller, we have
            // to add a second check to make sure it is not filtered out.
            // TODO: Update this logic to @metamask/multichain-network-controller once all networks are migrated.
            nonEvmChainIds.includes(networkId),
        )
        // Append new networks to the end
        .concat(newNetworks);
    });

    // The network controller can potentially update to a chain that is not selected in our enabled network map.
    // This ensures that we fallback to a network that has been added to our network map.
    const evmChainIds = Object.keys(
      this.state.enabledNetworkMap[KnownCaipNamespace.Eip155],
    );
    this.#switchToEnabledNetworkIfNeeded(evmChainIds);
  }

  onNetworkRemoved(networkId: Hex | CaipChainId) {
    const caipId: CaipChainId = isCaipChainId(networkId)
      ? networkId
      : toEvmCaipChainId(networkId);

    const { namespace } = parseCaipChainId(caipId);

    if (namespace === KnownCaipNamespace.Eip155) {
      this.update((state) => {
        delete state.enabledNetworkMap[namespace][networkId];
        if (Object.keys(state.enabledNetworkMap[namespace]).length === 0) {
          state.enabledNetworkMap[namespace]['0x1'] = true;
        }
      });
    } else {
      this.update((state) => {
        delete state.enabledNetworkMap[namespace][caipId];
      });
    }
  }

  /**
   * Updates the networks list in the state with the provided list of networks.
   *
   * @param networkList - The list of networks to update in the state.
   */

  updateNetworksList(chainIds: CaipChainId[]) {
    this.update((state) => {
      state.orderedNetworkList = chainIds.map((chainId) => ({
        networkId: chainId,
      }));
    });
  }

  /**
   * Sets the enabled networks in the controller state.
   * This method updates the enabledNetworkMap to mark specified networks as enabled.
   * It can handle both a single chain ID or an array of chain IDs.
   *
   * @param chainIds - A single CaipChainId (e.g. 'eip155:1') or an array of chain IDs
   * to be enabled. All other networks will be implicitly disabled.
   * @param networkId - The CaipChainId namespace of the currently selected network
   */
  setEnabledNetworks(chainIds: string | string[], networkId: string) {
    if (!networkId) {
      throw new Error('networkId is required to set enabled networks');
    }
    if (!chainIds) {
      throw new Error('chainIds is required to set enabled networks');
    }
    const ids = Array.isArray(chainIds) ? chainIds : [chainIds];

    this.update((state) => {
      const enabledNetworks = Object.fromEntries(ids.map((id) => [id, true]));

      // Add the enabled networks to the mapping for the specified network type
      state.enabledNetworkMap[networkId] = enabledNetworks;
    });

    this.#switchToEnabledNetworkIfNeeded(ids);
  }

  /**
   * Switches to an enabled network if the currently selected network is not in the enabled list.
   * This is a private helper method that handles the network switching logic.
   *
   * @param chainIds - Array of enabled chain IDs
   */
  #switchToEnabledNetworkIfNeeded(chainIds: string[]) {
    // Early return if no enabled networks
    if (chainIds.length === 0) {
      return;
    }

    const { selectedNetworkClientId, networkConfigurationsByChainId } =
      this.messagingSystem.call('NetworkController:getState');

    const selectedNetworkChainId = Object.values(
      networkConfigurationsByChainId,
    ).find(
      (network) =>
        network.rpcEndpoints?.[network.defaultRpcEndpointIndex]
          ?.networkClientId === selectedNetworkClientId,
    )?.chainId;

    const networkConf = Object.values(networkConfigurationsByChainId).find(
      (network) => network.chainId === chainIds[0],
    );

    const clientId =
      networkConf?.rpcEndpoints?.[networkConf.defaultRpcEndpointIndex]
        ?.networkClientId;

    if (
      selectedNetworkChainId &&
      !chainIds.includes(selectedNetworkChainId) &&
      clientId
    ) {
      // Settimout delay to run this in a seperate 'tick'.
      // There were some issues related to background state being updated, but persisted state not being updated.
      setTimeout(() => {
        this.messagingSystem.call(
          'NetworkController:setActiveNetwork',
          clientId,
        );
      }, 0);
    }
  }
}
