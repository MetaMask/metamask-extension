const version = 37
const clone = require('clone')

/*

removes computedBalances from state

*/

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
  if (state.computedBalances !== undefined) {
    delete state.computedBalances
  }
  return state
}
