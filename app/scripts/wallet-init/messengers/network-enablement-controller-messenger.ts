import { Messenger } from '@metamask/messenger';
import type { AccountsControllerSelectedAccountChangeEvent } from '@metamask/accounts-controller';
import type {
  AccountTreeControllerGetAccountsFromSelectedAccountGroupAction,
  AccountTreeControllerSelectedAccountGroupChangeEvent,
} from '@metamask/account-tree-controller';
import type { ConfigRegistryControllerGetStateAction } from '@metamask/config-registry-controller';
import type { NetworkControllerNetworkAddedEvent } from '@metamask/network-controller';
import type { NetworkEnablementControllerStateChangeEvent } from '@metamask/network-enablement-controller';
import type { RootMessenger } from '../../lib/messenger';

export type NetworkEnablementControllerInitMessengerActions =
  | AccountTreeControllerGetAccountsFromSelectedAccountGroupAction
  | ConfigRegistryControllerGetStateAction;

export type NetworkEnablementControllerInitMessengerEvents =
  | AccountsControllerSelectedAccountChangeEvent
  | AccountTreeControllerSelectedAccountGroupChangeEvent
  | NetworkControllerNetworkAddedEvent
  | NetworkEnablementControllerStateChangeEvent;

export type NetworkEnablementControllerInitMessenger = ReturnType<
  typeof getNetworkEnablementControllerInitMessenger
>;

/**
 * Create a messenger restricted to the actions and events the extension-side
 * `NetworkEnablementController` setup needs. The wallet-owned
 * `NetworkEnablementController` builds its own controller messenger; this
 * init messenger is only for the extension's network-selection behavior.
 *
 * @param messenger - The root messenger used to create the restricted messenger.
 * @returns The restricted network enablement init messenger.
 */
export function getNetworkEnablementControllerInitMessenger(
  messenger: RootMessenger<
    NetworkEnablementControllerInitMessengerActions,
    NetworkEnablementControllerInitMessengerEvents
  >,
) {
  const networkEnablementControllerInitMessenger = new Messenger<
    'NetworkEnablementControllerInit',
    NetworkEnablementControllerInitMessengerActions,
    NetworkEnablementControllerInitMessengerEvents,
    typeof messenger
  >({
    namespace: 'NetworkEnablementControllerInit',
    parent: messenger,
  });

  messenger.delegate({
    messenger: networkEnablementControllerInitMessenger,
    actions: [
      'AccountTreeController:getAccountsFromSelectedAccountGroup',
      'ConfigRegistryController:getState',
    ],
    events: [
      'AccountsController:selectedAccountChange',
      'AccountTreeController:selectedAccountGroupChange',
      'NetworkController:networkAdded',
      'NetworkEnablementController:stateChange',
    ],
  });

  return networkEnablementControllerInitMessenger;
}
