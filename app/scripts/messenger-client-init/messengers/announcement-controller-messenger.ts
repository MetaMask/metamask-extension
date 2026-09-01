import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import { AnnouncementControllerMessenger } from '@metamask/announcement-controller';
import { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the allowed actions and events of the
 * announcement controller.
 *
 * @param messenger - The base messenger used to create the restricted
 * messenger.
 */
export function getAnnouncementControllerMessenger(
  messenger: RootMessenger<
    MessengerActions<AnnouncementControllerMessenger>,
    MessengerEvents<AnnouncementControllerMessenger>
  >,
): AnnouncementControllerMessenger {
  const controllerMessenger: AnnouncementControllerMessenger = new Messenger({
    namespace: 'AnnouncementController',
    parent: messenger,
  });
  return controllerMessenger;
}
