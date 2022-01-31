import { cloneDeep } from 'lodash';

const version = 42;

/**
 * Initialize `connectedStatusPopoverHasBeenShown` to `false` if it hasn't yet been set,
 * so that existing users are introduced to the new connected status indicator
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
  if (state.AppStateController) {
    state.AppStateController.connectedStatusPopoverHasBeenShown = false;
  } else {
    state.AppStateController = {
      connectedStatusPopoverHasBeenShown: false,
    };
  }
  return state;
}
