import { Messenger } from '@metamask/messenger';
import { KeyringControllerGetEncryptionPublicKeyAction } from '@metamask/keyring-controller';
import {
  AllowedActions,
  AllowedEvents,
} from '../../controllers/encryption-public-key';
import { MetaMetricsControllerTrackEventAction } from '../../controllers/metametrics-controller';
import { RootMessenger } from '../../lib/messenger';

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
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
) {
  const controllerMessenger = new Messenger<
    'EncryptionPublicKeyController',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
    namespace: 'EncryptionPublicKeyController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'ApprovalController:addRequest',
      'ApprovalController:acceptRequest',
      'ApprovalController:rejectRequest',
    ],
    events: [
      'EncryptionPublicKeyManager:stateChange',
      'EncryptionPublicKeyManager:unapprovedMessage',
    ],
  });
  return controllerMessenger;
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
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'EncryptionPublicKeyControllerInit',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'EncryptionPublicKeyControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: [
      'KeyringController:getEncryptionPublicKey',
      'MetaMetricsController:trackEvent',
    ],
  });
  return controllerInitMessenger;
}
