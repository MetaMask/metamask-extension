import { Messenger } from '@metamask/messenger';
import { RootMessenger } from '../../lib/messenger';

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
  messenger: RootMessenger<never, never>,
) {
  return new Messenger<
    'AnnouncementController',
    never,
    never,
    typeof messenger
  >({
    namespace: 'AnnouncementController',
    parent: messenger,
  });
}
