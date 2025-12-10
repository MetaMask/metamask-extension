import { ControllerStateChangeEvent } from '@metamask/base-controller';
import { Messenger } from '@metamask/messenger';
import type {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetSelectedNetworkClientAction,
  NetworkControllerGetStateAction,
  NetworkControllerNetworkDidChangeEvent,
  NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';
import { AddApprovalRequest } from '@metamask/approval-controller';
import {
  AccountsControllerGetAccountAction,
  AccountsControllerGetSelectedAccountAction,
  AccountsControllerListAccountsAction,
  AccountsControllerSelectedEvmAccountChangeEvent,
} from '@metamask/accounts-controller';
import { TokenListController } from '@metamask/assets-controllers';
import { KeyringControllerAccountRemovedEvent } from '@metamask/keyring-controller';
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
  | AddApprovalRequest
  | NetworkControllerGetNetworkClientByIdAction;

type AllowedEvents =
  | AccountsControllerSelectedEvmAccountChangeEvent
  | KeyringControllerAccountRemovedEvent
  | NetworkControllerNetworkDidChangeEvent
  | NetworkControllerStateChangeEvent
  | PreferencesControllerStateChangeEvent
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
      'KeyringController:accountRemoved',
      'NetworkController:networkDidChange',
      'NetworkController:stateChange',
      'PreferencesController:stateChange',
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
