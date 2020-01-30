const version = 34
const clone = require('clone')

/**
 * The purpose of this migration is to enable the {@code privacyMode} feature flag and set the user as being migrated
 * if it was {@code false}.
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

    if (!featureFlags.privacyMode && typeof PreferencesController.migratedPrivacyMode === 'undefined') {
      // Mark the state has being migrated and enable Privacy Mode
      PreferencesController.migratedPrivacyMode = true
      featureFlags.privacyMode = true
    }
  }

  return state
}
