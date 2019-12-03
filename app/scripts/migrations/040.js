const version = 40
const clone = require('clone')

/**
 * Site connections are now managed by the PermissionsController, and the
 * ProviderApprovalController is removed. This migration deletes all
 * ProviderApprovalController state.
 */
module.exports = {
  version,
  migrate: async function (originalVersionedData) {
    const versionedData = clone(originalVersionedData)
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
