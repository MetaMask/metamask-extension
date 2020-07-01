const version = 43
import { cloneDeep } from 'lodash'

/**
 * Remove unused 'currentAccountTab' state
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
  if (state?.PreferencesController?.currentAccountTab) {
    delete state.PreferencesController.currentAccountTab
  }
  return state
}
