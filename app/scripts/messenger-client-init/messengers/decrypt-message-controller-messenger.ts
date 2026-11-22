import {
  Messenger,
  MessengerActions,
  MessengerEvents,
} from '@metamask/messenger';
import { DecryptMessageControllerMessenger } from '../../controllers/decrypt-message';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * decrypt message controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getDecryptMessageControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<DecryptMessageControllerMessenger>,
    MessengerEvents<DecryptMessageControllerMessenger>
  >,
) {
  const controllerMessenger: DecryptMessageControllerMessenger = new Messenger({
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

export type DecryptMessageControllerInitMessenger = ReturnType<
  typeof getDecryptMessageControllerInitMessenger
>;

export function getDecryptMessageControllerInitMessenger(
  messenger: RootMessenger<never, never>,
) {
  const controllerInitMessenger = new Messenger<
    'DecryptMessageControllerInit',
    never,
    never,
    typeof messenger
  >({
    namespace: 'DecryptMessageControllerInit',
    parent: messenger,
  });
  return controllerInitMessenger;
}
