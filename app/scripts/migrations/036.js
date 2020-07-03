const version = 36
import { cloneDeep } from 'lodash'

/**
 * The purpose of this migration is to remove the {@code privacyMode} feature flag.
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
  const { PreferencesController } = state

  if (PreferencesController) {
    const featureFlags = PreferencesController.featureFlags || {}

    if (typeof featureFlags.privacyMode !== 'undefined') {
      delete featureFlags.privacyMode
    }
  }

  return state
}
