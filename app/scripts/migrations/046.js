const version = 46
import { cloneDeep } from 'lodash'

/**
 * Delete {@code ABTestController} state
 */
export default {
  version,
  migrate: async function (originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData)
    versionedData.meta.version = version
    const state = versionedData.data
    versionedData.data = transformState(state)
    return versionedData
  },
}

function transformState (state) {
  if (typeof state?.ABTestController !== 'undefined') {
    delete state.ABTestController
  }
  return state
}
