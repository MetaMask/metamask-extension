import { Messenger } from '@metamask/base-controller';
import { KeyringControllerGetEncryptionPublicKeyAction } from '@metamask/keyring-controller';
import {
  AllowedActions,
  AllowedEvents,
} from '../../controllers/encryption-public-key';
import { MetaMetricsControllerTrackEventAction } from '../../controllers/metametrics-controller';

export type EncryptionPublicKeyControllerMessenger = ReturnType<
  typeof getEncryptionPublicKeyControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * encryption public key controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getEncryptionPublicKeyControllerMessenger(
  messenger: Messenger<AllowedActions, AllowedEvents>,
) {
  return messenger.getRestricted({
    name: 'EncryptionPublicKeyController',
    allowedActions: [
      'ApprovalController:addRequest',
      'ApprovalController:acceptRequest',
      'ApprovalController:rejectRequest',
    ],
    allowedEvents: [
      'EncryptionPublicKeyManager:stateChange',
      'EncryptionPublicKeyManager:unapprovedMessage',
    ],
  });
}

type AllowedInitializationActions =
  | KeyringControllerGetEncryptionPublicKeyAction
  | MetaMetricsControllerTrackEventAction;

export type EncryptionPublicKeyControllerInitMessenger = ReturnType<
  typeof getEncryptionPublicKeyControllerInitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events needed to
 * initialize the encryption public key controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getEncryptionPublicKeyControllerInitMessenger(
  messenger: Messenger<AllowedInitializationActions, never>,
) {
  return messenger.getRestricted({
    name: 'EncryptionPublicKeyControllerInit',
    allowedActions: [
      'KeyringController:getEncryptionPublicKey',
      'MetaMetricsController:trackEvent',
    ],
    allowedEvents: [],
  });
}
