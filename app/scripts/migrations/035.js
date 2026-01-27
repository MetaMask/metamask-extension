// next version number
/*

Removes the deprecated 'seedWords' state

*/

import { cloneDeep } from 'lodash';

const version = 35;

export default {
  version,

  async migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    versionedData.data = transformState(versionedData.data);
    return versionedData;
  },
};

function transformState(state) {
  if (
    state.PreferencesController &&
    state.PreferencesController.seedWords !== undefined
  ) {
    delete state.PreferencesController.seedWords;
  }

  // Also remove top-level seedWords if it exists (edge case from corrupted state)
  if (state.seedWords !== undefined) {
    delete state.seedWords;
  }

  return state;
}
