import { cloneDeep } from 'lodash';

const version = 71;

/**
 * Renames NotificationController to AnnouncementController
 */
export default {
  version,
  async migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data;
    const newState = transformState(state);
    versionedData.data = newState;
    return versionedData;
  },
};

function transformState(state) {
  if (state.NotificationController) {
    state.AnnouncementController = {
      announcements: state.NotificationController.notifications,
    };
    delete state.NotificationController;
  }
  return state;
}
