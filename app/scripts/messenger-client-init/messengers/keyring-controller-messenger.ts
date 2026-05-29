import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { KeyringControllerMessenger } from '@metamask/keyring-controller';
import { AppStateControllerRequestQrCodeScanAction } from '../../controllers/app-state-controller-method-action-types';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * keyring controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getKeyringControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<KeyringControllerMessenger>,
    MessengerEvents<KeyringControllerMessenger>
  >,
): KeyringControllerMessenger {
  const controllerMessenger: KeyringControllerMessenger = new Messenger({
    namespace: 'KeyringController',
    parent: messenger,
  });
  return controllerMessenger;
}

type AllowedInitializationActions = AppStateControllerRequestQrCodeScanAction;

export type KeyringControllerInitMessenger = ReturnType<
  typeof getKeyringControllerInitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events needed to
 * initialize the keyring controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getKeyringControllerInitMessenger(
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'KeyringControllerInit',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'KeyringControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: ['AppStateController:requestQrCodeScan'],
    events: [],
  });
  return controllerInitMessenger;
}
