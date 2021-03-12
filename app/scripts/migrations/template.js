// next version number
/*

description of migration and what it does

*/

import { cloneDeep } from 'lodash';

const version = 0;

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
  return newState;
}
