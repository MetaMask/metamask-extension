import { ControllerStateChangeEvent } from '@metamask/base-controller';
import { Messenger } from '@metamask/messenger';
import type {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetSelectedNetworkClientAction,
  NetworkControllerGetStateAction,
  NetworkControllerNetworkAddedEvent,
  NetworkControllerNetworkDidChangeEvent,
  NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';
import { ApprovalControllerAddRequestAction } from '@metamask/approval-controller';
import {
  AccountsControllerAccountAddedEvent,
  AccountsControllerGetAccountAction,
  AccountsControllerGetSelectedAccountAction,
  AccountsControllerListAccountsAction,
  AccountsControllerSelectedEvmAccountChangeEvent,
} from '@metamask/accounts-controller';
import { TokenListController } from '@metamask/assets-controllers';
import {
  KeyringControllerAccountRemovedEvent,
  KeyringControllerUnlockEvent,
} from '@metamask/keyring-controller';
import { PreferencesControllerStateChangeEvent } from '../../controllers/preferences-controller';
import { RootMessenger } from '../../lib/messenger';

// Not exported from `@metamask/assets-controllers`.
type TokenListControllerStateChangeEvent = ControllerStateChangeEvent<
  'TokenListController',
  TokenListController['state']
>;

type AllowedActions =
  | AccountsControllerGetAccountAction
  | AccountsControllerGetSelectedAccountAction
  | AccountsControllerListAccountsAction
  | ApprovalControllerAddRequestAction
  | NetworkControllerGetNetworkClientByIdAction;

type AllowedEvents =
  | AccountsControllerSelectedEvmAccountChangeEvent
  | AccountsControllerAccountAddedEvent
  | KeyringControllerAccountRemovedEvent
  | KeyringControllerUnlockEvent
  | NetworkControllerNetworkDidChangeEvent
  | NetworkControllerStateChangeEvent
  | NetworkControllerNetworkAddedEvent
  | TokenListControllerStateChangeEvent;

export type TokensControllerMessenger = ReturnType<
  typeof getTokensControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * tokens controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getTokensControllerMessenger(
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
) {
  const controllerMessenger = new Messenger<
    'TokensController',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
    namespace: 'TokensController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'AccountsController:getAccount',
      'AccountsController:getSelectedAccount',
      'AccountsController:listAccounts',
      'ApprovalController:addRequest',
      'NetworkController:getNetworkClientById',
    ],
    events: [
      'AccountsController:selectedEvmAccountChange',
      'AccountsController:accountAdded',
      'KeyringController:accountRemoved',
      'KeyringController:unlock',
      'NetworkController:networkDidChange',
      'NetworkController:stateChange',
      'NetworkController:networkAdded',
      'TokenListController:stateChange',
    ],
  });
  return controllerMessenger;
}

type AllowedInitializationActions =
  | NetworkControllerGetNetworkClientByIdAction
  | NetworkControllerGetSelectedNetworkClientAction
  | NetworkControllerGetStateAction;

export type TokensControllerInitMessenger = ReturnType<
  typeof getTokensControllerInitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events needed during
 * initialization of the tokens controller.
 *
 * @param messenger
 */
export function getTokensControllerInitMessenger(
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'TokensControllerInit',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'TokensControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: [
      'NetworkController:getNetworkClientById',
      'NetworkController:getSelectedNetworkClient',
      'NetworkController:getState',
    ],
  });
  return controllerInitMessenger;
}
