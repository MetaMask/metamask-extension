import { cloneDeep } from 'lodash';

const version = 58;

/**
 * Deletes the swapsWelcomeMessageHasBeenShown property from state
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
  delete state.AppStateController?.swapsWelcomeMessageHasBeenShown;

  return state;
}
