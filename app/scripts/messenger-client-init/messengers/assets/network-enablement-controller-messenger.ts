import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import {
  NetworkEnablementControllerMessenger,
  type NetworkEnablementControllerGetStateAction,
  type NetworkEnablementControllerRestoreEnabledNetworkMapAction,
  type NetworkEnablementControllerStateChangeEvent,
} from '@metamask/network-enablement-controller';
import { AccountsControllerSelectedAccountChangeEvent } from '@metamask/accounts-controller';
import {
  AccountTreeControllerGetAccountsFromSelectedAccountGroupAction,
  AccountTreeControllerSelectedAccountGroupChangeEvent,
} from '@metamask/account-tree-controller';
import { RootMessenger } from '../../../lib/messenger';

/**
 * Actions on NetworkEnablementController that external messengers may delegate
 * when adding a network without switching the active network filter.
 */
export type NetworkEnablementControllerExternalActions =
  | NetworkEnablementControllerGetStateAction
  | NetworkEnablementControllerRestoreEnabledNetworkMapAction;

/**
 * Events on NetworkEnablementController that external messengers may subscribe
 * to when restoring enabled networks after adding a network.
 */
export type NetworkEnablementControllerExternalEvents =
  NetworkEnablementControllerStateChangeEvent;

/**
 * Actions on NetworkEnablementController delegated to external callers.
 */
export const NETWORK_ENABLEMENT_CONTROLLER_EXTERNAL_ACTIONS = [
  'NetworkEnablementController:getState',
  'NetworkEnablementController:restoreEnabledNetworkMap',
] as const satisfies readonly NetworkEnablementControllerExternalActions['type'][];

/**
 * Events on NetworkEnablementController delegated to external callers.
 */
export const NETWORK_ENABLEMENT_CONTROLLER_EXTERNAL_EVENTS = [
  'NetworkEnablementController:stateChange',
] as const satisfies readonly NetworkEnablementControllerExternalEvents['type'][];

export function getNetworkEnablementControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<NetworkEnablementControllerMessenger>,
    MessengerEvents<NetworkEnablementControllerMessenger>
  >,
): NetworkEnablementControllerMessenger {
  const controllerMessenger: NetworkEnablementControllerMessenger =
    new Messenger({
      namespace: 'NetworkEnablementController',
      parent: messenger,
    });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'NetworkController:getState',
      'MultichainNetworkController:getState',
    ],
    events: [
      'NetworkController:networkAdded',
      'NetworkController:networkRemoved',
      'NetworkController:stateChange',
      'TransactionController:transactionSubmitted',
    ],
  });
  return controllerMessenger;
}

type AllowedInitializationActions =
  AccountTreeControllerGetAccountsFromSelectedAccountGroupAction;

type AllowedInitializationEvents =
  | AccountsControllerSelectedAccountChangeEvent
  | AccountTreeControllerSelectedAccountGroupChangeEvent;

export type NetworkEnablementControllerInitMessenger = ReturnType<
  typeof getNetworkEnablementControllerInitMessenger
>;

/**
 * Create a messenger restricted to the allowed initialization events of the
 * network enablement controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getNetworkEnablementControllerInitMessenger(
  messenger: RootMessenger<
    AllowedInitializationActions,
    AllowedInitializationEvents
  >,
) {
  const controllerInitMessenger = new Messenger<
    'NetworkEnablementControllerInit',
    AllowedInitializationActions,
    AllowedInitializationEvents,
    typeof messenger
  >({
    namespace: 'NetworkEnablementControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: ['AccountTreeController:getAccountsFromSelectedAccountGroup'],
    events: [
      'AccountsController:selectedAccountChange',
      'AccountTreeController:selectedAccountGroupChange',
    ],
  });
  return controllerInitMessenger;
}
