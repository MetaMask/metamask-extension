import { Messenger } from '@metamask/messenger';
import {
  AllowedActions,
  AllowedEvents,
} from '../../controllers/decrypt-message';
import { MetaMetricsControllerTrackEventAction } from '../../controllers/metametrics-controller';
import { RootMessenger } from '../../lib/messenger';

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
  messenger: RootMessenger<AllowedActions, AllowedEvents>,
) {
  const controllerMessenger = new Messenger<
    'DecryptMessageController',
    AllowedActions,
    AllowedEvents,
    typeof messenger
  >({
    namespace: 'DecryptMessageController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: [
      'ApprovalController:addRequest',
      'ApprovalController:acceptRequest',
      'ApprovalController:rejectRequest',
      'KeyringController:decryptMessage',
    ],
    events: [
      'DecryptMessageManager:stateChange',
      'DecryptMessageManager:unapprovedMessage',
    ],
  });
  return controllerMessenger;
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
  messenger: RootMessenger<AllowedInitializationActions, never>,
) {
  const controllerInitMessenger = new Messenger<
    'DecryptMessageControllerInit',
    AllowedInitializationActions,
    never,
    typeof messenger
  >({
    namespace: 'DecryptMessageControllerInit',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerInitMessenger,
    actions: ['MetaMetricsController:trackEvent'],
  });
  return controllerInitMessenger;
}
