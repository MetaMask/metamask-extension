import { Messenger } from '@metamask/messenger';
import {
  AccountsControllerListMultichainAccountsAction,
  AccountsControllerSelectedAccountChangeEvent,
} from '@metamask/accounts-controller';
import {
  type NetworkControllerSetActiveNetworkAction,
  type NetworkControllerGetStateAction,
  type NetworkControllerRemoveNetworkAction,
  type NetworkControllerGetSelectedChainIdAction,
  type NetworkControllerFindNetworkClientIdByChainIdAction,
} from '@metamask/network-controller';
import { RootMessenger } from '../../../lib/messenger';

type Actions =
  | NetworkControllerGetStateAction
  | NetworkControllerSetActiveNetworkAction
  | NetworkControllerRemoveNetworkAction
  | NetworkControllerGetSelectedChainIdAction
  | NetworkControllerFindNetworkClientIdByChainIdAction
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
  messenger: RootMessenger<Actions, Events>,
) {
  const controllerMessenger = new Messenger<
    'MultichainNetworkController',
    Actions,
    Events,
    typeof messenger
  >({
    namespace: 'MultichainNetworkController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'NetworkController:setActiveNetwork',
      'NetworkController:getState',
      'NetworkController:removeNetwork',
      'NetworkController:findNetworkClientIdByChainId',
      'NetworkController:getSelectedChainId',
      'AccountsController:listMultichainAccounts',
    ],
    events: ['AccountsController:selectedAccountChange'],
  });
  return controllerMessenger;
}
