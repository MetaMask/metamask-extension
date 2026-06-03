import {
  AnnouncementController,
  AnnouncementControllerMessenger,
} from '@metamask/announcement-controller';
import { UI_NOTIFICATIONS } from '../../../shared/notifications';
import { MessengerClientInitFunction } from './types';

/**
 * Initialize the announcement controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state to use for the
 * controller.
 * @returns The initialized controller.
 */
export const AnnouncementControllerInit: MessengerClientInitFunction<
  AnnouncementController,
  AnnouncementControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const messengerClient = new AnnouncementController({
    messenger: controllerMessenger,
    allAnnouncements: UI_NOTIFICATIONS,
    // @ts-expect-error: Announcement controller does not accept partial state.
    state: persistedState.AnnouncementController,
  });

  return {
    messengerClient,
  };
};
