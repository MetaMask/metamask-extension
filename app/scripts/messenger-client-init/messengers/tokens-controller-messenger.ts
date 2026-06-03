import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { TokensControllerMessenger } from '@metamask/assets-controllers';
import type {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetSelectedNetworkClientAction,
  NetworkControllerGetStateAction,
} from '@metamask/network-controller';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * tokens controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getTokensControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<TokensControllerMessenger>,
    MessengerEvents<TokensControllerMessenger>
  >,
): TokensControllerMessenger {
  const controllerMessenger: TokensControllerMessenger = new Messenger({
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
