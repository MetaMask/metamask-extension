import { cloneDeep } from 'lodash';

const version = 75;

/**
 * Delete the ThreeBoxController.
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
  delete state.ThreeBoxController;
  return state;
}
