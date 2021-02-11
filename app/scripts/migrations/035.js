// next version number
const version = 35

/*

Removes the deprecated 'seedWords' state

*/

import { cloneDeep } from 'lodash'

export default {
  version,

  migrate: async function (originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData)
    versionedData.meta.version = version
    versionedData.data = transformState(versionedData.data)
    return versionedData
  },
}

function transformState (state) {
  if (state.PreferencesController && state.PreferencesController.seedWords !== undefined) {
    delete state.PreferencesController.seedWords
  }
  return state
}
