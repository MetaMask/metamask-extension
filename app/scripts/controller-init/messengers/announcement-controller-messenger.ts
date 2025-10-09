import { Messenger } from '@metamask/base-controller';

export type AnnouncementControllerMessenger = ReturnType<
  typeof getAnnouncementControllerMessenger
>;

/**
 * Create a messenger restricted to the allowed actions and events of the
 * announcement controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getAnnouncementControllerMessenger(
  messenger: Messenger<never, never>,
) {
  return messenger.getRestricted({
    name: 'AnnouncementController',

    // This controller does not call any actions or subscribe to any events.
    allowedActions: [],
    allowedEvents: [],
  });
}
