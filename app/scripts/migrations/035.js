// next version number
/*

Removes the deprecated 'seedWords' state

*/

import { cloneDeep } from '../../../shared/modules/object.utils';

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
  return state;
}
