// next version number
const version = 33

/*

Cleans up notices and assocated notice controller code

*/

const clone = require('clone')

module.exports = {
  version,

  migrate: async function (originalVersionedData) {
    const versionedData = clone(originalVersionedData)
    versionedData.meta.version = version
    const state = versionedData.data
    const newState = transformState(state)
    versionedData.data = newState
    return versionedData
  },
}

function transformState (state) {
  const newState = state
  // transform state here
  if (state.NoticeController) {
    delete newState.NoticeController
  }
  return newState
}
