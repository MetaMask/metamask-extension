import {
  ControllerStateChangeEvent,
  Messenger,
} from '@metamask/base-controller';
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
  messenger: Messenger<AllowedActions, AllowedEvents>,
) {
  return messenger.getRestricted({
    name: 'TokensController',
    allowedActions: [
      'AccountsController:getAccount',
      'AccountsController:getSelectedAccount',
      'AccountsController:listAccounts',
      'ApprovalController:addRequest',
      'NetworkController:getNetworkClientById',
    ],
    allowedEvents: [
      'AccountsController:selectedEvmAccountChange',
      'KeyringController:accountRemoved',
      'NetworkController:networkDidChange',
      'NetworkController:stateChange',
      'PreferencesController:stateChange',
      'TokenListController:stateChange',
    ],
  });
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
  messenger: Messenger<AllowedInitializationActions, never>,
) {
  return messenger.getRestricted({
    name: 'TokensControllerInit',
    allowedActions: [
      'NetworkController:getNetworkClientById',
      'NetworkController:getSelectedNetworkClient',
      'NetworkController:getState',
    ],
    allowedEvents: [],
  });
}
