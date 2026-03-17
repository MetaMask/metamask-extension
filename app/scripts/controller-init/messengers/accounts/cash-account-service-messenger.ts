import { Messenger } from '@metamask/messenger';
import {
  KeyringControllerAddNewKeyringAction,
  KeyringControllerGetKeyringsByTypeAction,
  KeyringControllerGetStateAction,
} from '@metamask/keyring-controller';
import { CashAccountServiceMessenger } from '@metamask-previews/cash-account-service';
import { RootMessenger } from '../../../lib/messenger';

type Actions =
  | KeyringControllerGetStateAction
  | KeyringControllerGetKeyringsByTypeAction
  | KeyringControllerAddNewKeyringAction;

type Events = never;

/**
 * Get a restricted messenger for the cash account service. This is scoped to the
 * actions and events that this service is allowed to handle.
 *
 * @param messenger - The controller messenger to restrict.
 * @returns The restricted controller messenger.
 */
export function getCashAccountServiceMessenger(
  messenger: RootMessenger<Actions, Events>,
): CashAccountServiceMessenger {
  const serviceMessenger = new Messenger<
    'CashAccountService',
    Actions,
    Events,
    typeof messenger
  >({
    namespace: 'CashAccountService',
    parent: messenger,
  });
  messenger.delegate({
    messenger: serviceMessenger,
    events: [],
    actions: [
      'KeyringController:getState',
      'KeyringController:getKeyringsByType',
      'KeyringController:addNewKeyring',
    ],
  });
  return serviceMessenger;
}
