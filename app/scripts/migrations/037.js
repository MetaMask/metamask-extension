const version = 37
const clone = require('clone')

/**
 * The purpose of this migration is to remove the {@code privacyMode} feature flag.
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
  const { PreferencesController } = state

  if (PreferencesController) {
    const featureFlags = PreferencesController.featureFlags || {}

    if (typeof featureFlags.threeBox === 'undefined') {
      featureFlags.threeBox = false
    }

    state = {
      ...state,
      featureFlags,
    }
  }

  return state
}
