const version = 36
import clone from 'clone'

/**
 * The purpose of this migration is to remove the {@code privacyMode} feature flag.
 */
export default {
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

    if (typeof featureFlags.privacyMode !== 'undefined') {
      delete featureFlags.privacyMode
    }
  }

  return state
}
