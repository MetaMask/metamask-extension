import { Messenger } from '@metamask/base-controller';
import {
  AllowedActions,
  AllowedEvents,
} from '../../controllers/decrypt-message';
import { MetaMetricsControllerTrackEventAction } from '../../controllers/metametrics-controller';

export type DecryptMessageControllerMessenger = ReturnType<
  typeof getDecryptMessageControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * decrypt message controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getDecryptMessageControllerMessenger(
  messenger: Messenger<AllowedActions, AllowedEvents>,
) {
  return messenger.getRestricted({
    name: 'DecryptMessageController',
    allowedActions: [
      'ApprovalController:addRequest',
      'ApprovalController:acceptRequest',
      'ApprovalController:rejectRequest',
      'KeyringController:decryptMessage',
    ],
    allowedEvents: [
      'DecryptMessageManager:stateChange',
      'DecryptMessageManager:unapprovedMessage',
    ],
  });
}

type AllowedInitializationActions = MetaMetricsControllerTrackEventAction;

export type DecryptMessageControllerInitMessenger = ReturnType<
  typeof getDecryptMessageControllerInitMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events needed to
 * initialize the decrypt message controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getDecryptMessageControllerInitMessenger(
  messenger: Messenger<AllowedInitializationActions, never>,
) {
  return messenger.getRestricted({
    name: 'DecryptMessageControllerInit',
    allowedActions: ['MetaMetricsController:trackEvent'],
    allowedEvents: [],
  });
}
