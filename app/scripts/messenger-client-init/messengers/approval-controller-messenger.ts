import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { ApprovalControllerMessenger } from '@metamask/approval-controller';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * approval controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getApprovalControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<ApprovalControllerMessenger>,
    MessengerEvents<ApprovalControllerMessenger>
  >,
) {
  const controllerMessenger: ApprovalControllerMessenger = new Messenger({
    namespace: 'ApprovalController',
    parent: messenger,
  });
  return controllerMessenger;
}
