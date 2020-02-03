const version = 40
import { cloneDeep } from 'lodash'

/**
 * Site connections are now managed by the PermissionsController, and the
 * ProviderApprovalController is removed. This migration deletes all
 * ProviderApprovalController state.
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
  delete state.ProviderApprovalController
  return state
}
