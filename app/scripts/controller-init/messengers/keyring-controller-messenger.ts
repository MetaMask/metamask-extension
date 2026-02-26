import { Messenger } from '@metamask/messenger';
import { AppStateControllerRequestQrCodeScanAction } from '../../controllers/app-state-controller';
import { RootMessenger } from '../../lib/messenger';

export type KeyringControllerMessenger = ReturnType<
  typeof getKeyringControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * keyring controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getKeyringControllerMessenger(
  messenger: RootMessenger<never, never>,
) {
  return new Messenger<'KeyringController', never, never, typeof messenger>({
    namespace: 'KeyringController',
    parent: messenger,
  });
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
