// next version number
const version = 35

/*

Removes the deprecated 'seedWords' state

*/

const clone = require('clone')

module.exports = {
  version,

  migrate: async function (originalVersionedData) {
    const versionedData = clone(originalVersionedData)
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
