import { Messenger } from '@metamask/base-controller';
import {
  AccountsControllerListMultichainAccountsAction,
  AccountsControllerSelectedAccountChangeEvent,
} from '@metamask/accounts-controller';
import {
  type NetworkControllerSetActiveNetworkAction,
  type NetworkControllerGetStateAction,
} from '@metamask/network-controller';

type Actions =
  | NetworkControllerSetActiveNetworkAction
  | NetworkControllerGetStateAction
  | AccountsControllerListMultichainAccountsAction;

type Events = AccountsControllerSelectedAccountChangeEvent;

export type MultichainNetworkControllerMessenger = ReturnType<
  typeof getMultichainNetworkControllerMessenger
>;

/**
 * Get a restricted messenger for the Multichain Network controller. This is scoped to the
 * actions and events that the Multichain Network controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getMultichainNetworkControllerMessenger(
  messenger: Messenger<Actions, Events>,
) {
  return messenger.getRestricted({
    name: 'MultichainNetworkController',
    allowedActions: [
      'NetworkController:setActiveNetwork',
      'NetworkController:getState',
      'AccountsController:listMultichainAccounts',
    ],
    allowedEvents: ['AccountsController:selectedAccountChange'],
  });
}
