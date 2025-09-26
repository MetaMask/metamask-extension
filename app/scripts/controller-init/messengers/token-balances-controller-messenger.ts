import {
  ControllerGetStateAction,
  ControllerStateChangeEvent,
  Messenger,
} from '@metamask/base-controller';
import type {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
  NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';
import {
  AccountsControllerGetSelectedAccountAction,
  AccountsControllerListAccountsAction,
} from '@metamask/accounts-controller';
import {
  AccountTrackerUpdateNativeBalancesAction,
  AccountTrackerUpdateStakedBalancesAction,
  TokensControllerState,
} from '@metamask/assets-controllers';
import { KeyringControllerAccountRemovedEvent } from '@metamask/keyring-controller';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import {
  PreferencesControllerGetStateAction,
  PreferencesControllerStateChangeEvent,
} from '../../controllers/preferences-controller';

// Not exported from `@metamask/assets-controllers`.
type TokensControllerGetStateAction = ControllerGetStateAction<
  'TokensController',
  TokensControllerState
>;

type TokensControllerStateChangeEvent = ControllerStateChangeEvent<
  'TokensController',
  TokensControllerState
>;

type AllowedActions =
  | AccountsControllerGetSelectedAccountAction
  | AccountsControllerListAccountsAction
  | AccountTrackerUpdateNativeBalancesAction
  | AccountTrackerUpdateStakedBalancesAction
  | NetworkControllerGetNetworkClientByIdAction
  | NetworkControllerGetStateAction
  | PreferencesControllerGetStateAction
  | TokensControllerGetStateAction;

type AllowedEvents =
  | KeyringControllerAccountRemovedEvent
  | NetworkControllerStateChangeEvent
  | PreferencesControllerStateChangeEvent
  | TokensControllerStateChangeEvent;

export type TokenBalancesControllerMessenger = ReturnType<
  typeof getTokenBalancesControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * token balances controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getTokenBalancesControllerMessenger(
  messenger: Messenger<AllowedActions, AllowedEvents>,
) {
  return messenger.getRestricted({
    name: 'TokenBalancesController',
    allowedActions: [
      'NetworkController:getState',
      'NetworkController:getNetworkClientById',
      'TokensController:getState',
      'PreferencesController:getState',
      'AccountsController:getSelectedAccount',
      'AccountsController:listAccounts',
      'AccountTrackerController:updateNativeBalances',
      'AccountTrackerController:updateStakedBalances',
    ],
    allowedEvents: [
      'PreferencesController:stateChange',
      'TokensController:stateChange',
      'NetworkController:stateChange',
      'KeyringController:accountRemoved',
    ],
  });
}

type AllowedInitializationActions =
  | PreferencesControllerGetStateAction
  | RemoteFeatureFlagControllerGetStateAction;

export type TokenBalancesControllerInitMessenger = ReturnType<
  typeof getTokenBalancesControllerInitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events needed during
 * initialization of the token balances controller.
 *
 * @param messenger
 */
export function getTokenBalancesControllerInitMessenger(
  messenger: Messenger<AllowedInitializationActions, never>,
) {
  return messenger.getRestricted({
    name: 'TokenBalancesControllerInit',
    allowedActions: [
      'PreferencesController:getState',
      'RemoteFeatureFlagController:getState',
    ],
    allowedEvents: [],
  });
}
