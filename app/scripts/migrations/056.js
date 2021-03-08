import { cloneDeep } from 'lodash';
import { UI_NOTIFICATIONS } from '../../../shared/notifications';

const SWAPS_NOTIFICATION_ID = 1;

const version = 56;

/**
 * Set the new swaps notification isShown property to true if swapsWelcomeMessageHasBeenShown is true, and delete the swapsWelcomeMessageHasBeenShown property in either case
 */
export default {
  version,
  async migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data;
    versionedData.data = transformState(state);
    return versionedData;
  },
};

function transformState(state) {
  const { swapsWelcomeMessageHasBeenShown } = state?.AppStateController || {};
  let notifications = state.NotificationController?.notifications;

  if (swapsWelcomeMessageHasBeenShown) {
    notifications = {
      ...notifications,
      [SWAPS_NOTIFICATION_ID]: {
        ...UI_NOTIFICATIONS[SWAPS_NOTIFICATION_ID],
        isShown: true,
      },
    };
    state.NotificationController = {
      ...state.NotificationController,
      notifications,
    };
  }

  delete state.AppStateController?.swapsWelcomeMessageHasBeenShown;

  return state;
}
