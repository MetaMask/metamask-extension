// next version number
/*

Cleans up notices and assocated notice controller code

*/

import { cloneDeep } from 'lodash';

const version = 33;

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
  const newState = state;
  // transform state here
  if (state.NoticeController) {
    delete newState.NoticeController;
  }
  return newState;
}
