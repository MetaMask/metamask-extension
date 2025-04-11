import type {
  AccountsControllerGetSelectedAccountAction,
  AccountsControllerGetAccountAction,
  AccountsControllerSelectedEvmAccountChangeEvent,
} from '@metamask/accounts-controller';
import type {
  TokensControllerGetStateAction,
  TokensControllerStateChangeEvent,
} from '@metamask/assets-controllers';
import type { Messenger } from '@metamask/base-controller';
import type {
  NetworkControllerGetStateAction,
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerStateChangeEvent,
} from '@metamask/network-controller';
import type { PreferencesControllerStateChangeEvent } from '@metamask/preferences-controller';

type Actions =
  | TokensControllerGetStateAction
  | NetworkControllerGetNetworkClientByIdAction
  | NetworkControllerGetStateAction
  | AccountsControllerGetAccountAction
  | AccountsControllerGetSelectedAccountAction;

type Events =
  | NetworkControllerStateChangeEvent
  | AccountsControllerSelectedEvmAccountChangeEvent
  | PreferencesControllerStateChangeEvent
  | TokensControllerStateChangeEvent;

export type TokenRatesControllerMessenger = ReturnType<
  typeof getTokenRatesControllerMessenger
>;

/**
 * Get a restricted messenger for the Token Rates controller. This is scoped to the
 * actions and events that the Token Rates controller is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getTokenRatesControllerMessenger(
  messenger: Messenger<Actions, Events>,
) {
  return messenger.getRestricted({
    name: 'TokenRatesController',
    allowedActions: [
      'TokensController:getState',
      'NetworkController:getNetworkClientById',
      'NetworkController:getState',
      'AccountsController:getAccount',
      'AccountsController:getSelectedAccount',
    ],
    allowedEvents: [
      'NetworkController:stateChange',
      'AccountsController:selectedEvmAccountChange',
      'PreferencesController:stateChange',
      'TokensController:stateChange',
    ],
  });
}
