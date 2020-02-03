const version = 21

/*

This migration removes the BlackListController from disk state

*/

import { cloneDeep } from 'lodash'

export default {
  version,

  migrate: function (originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData)
    versionedData.meta.version = version
    try {
      const state = versionedData.data
      const newState = transformState(state)
      versionedData.data = newState
    } catch (err) {
      console.warn(`MetaMask Migration #${version}` + err.stack)
    }
    return Promise.resolve(versionedData)
  },
}

function transformState (state) {
  const newState = state
  delete newState.BlacklistController
  delete newState.RecentBlocks
  return newState
}

