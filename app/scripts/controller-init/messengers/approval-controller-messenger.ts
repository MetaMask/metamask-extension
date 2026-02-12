import { Messenger } from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';

export type ApprovalControllerMessenger = ReturnType<
  typeof getApprovalControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * approval controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getApprovalControllerMessenger(
  messenger: RootMessenger<never, never>,
) {
  return new Messenger<'ApprovalController', never, never, typeof messenger>({
    namespace: 'ApprovalController',
    parent: messenger,
  });
}
