import { cloneDeep } from 'lodash';

const version = 41;

/**
 * PreferencesController.autoLogoutTimeLimit -> autoLockTimeLimit
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
  if (state.PreferencesController && state.PreferencesController.preferences) {
    state.PreferencesController.preferences.autoLockTimeLimit =
      state.PreferencesController.preferences.autoLogoutTimeLimit;
    delete state.PreferencesController.preferences.autoLogoutTimeLimit;
  }
  return state;
}
