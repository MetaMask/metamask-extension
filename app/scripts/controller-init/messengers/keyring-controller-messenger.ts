import { Messenger } from '@metamask/base-controller';
import {
  AllowedActions,
  AllowedEvents,
} from '../../controllers/account-tracker-controller';
import { AppStateControllerRequestQrCodeScanAction } from '../../controllers/app-state-controller';

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
  messenger: Messenger<AllowedActions, AllowedEvents>,
) {
  return messenger.getRestricted({
    name: 'KeyringController',

    // This controller does not call any actions or subscribe to any events.
    allowedActions: [],
    allowedEvents: [],
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
  messenger: Messenger<AllowedInitializationActions, never>,
) {
  return messenger.getRestricted({
    name: 'KeyringControllerInit',
    allowedActions: ['AppStateController:requestQrCodeScan'],
    allowedEvents: [],
  });
}
