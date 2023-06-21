import { cloneDeep } from 'lodash';

const version = 73;

/**
 * Should empty the `knownMethodData` object in PreferencesController
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
  const PreferencesController = state?.PreferencesController || {};

  return {
    ...state,
    PreferencesController: {
      ...PreferencesController,
      knownMethodData: {},
    },
  };
}
