import { Messenger } from '@metamask/base-controller';

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
  messenger: Messenger<never, never>,
) {
  return messenger.getRestricted({
    name: 'ApprovalController',

    // This controller does not call any actions or subscribe to any events.
    allowedActions: [],
    allowedEvents: [],
  });
}
