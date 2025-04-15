/*

This migration removes the BlackListController from disk state

*/

import { cloneDeep } from 'lodash';

const version = 21;

export default {
  version,

  migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    try {
      const state = versionedData.data;
      const newState = transformState(state);
      versionedData.data = newState;
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31889
      // eslint-disable-next-line id-denylist
    } catch (err) {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31889
      // eslint-disable-next-line id-denylist
      console.warn(`MetaMask Migration #${version}${err.stack}`);
    }
    return Promise.resolve(versionedData);
  },
};

function transformState(state) {
  const newState = state;
  delete newState.BlacklistController;
  delete newState.RecentBlocks;
  return newState;
}
