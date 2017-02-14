const version = 11

/*

This migration breaks out the CurrencyController substate

*/

module.exports = {
  version,

  migrate: function (versionedData) {
    versionedData.meta.version = version
    try {
      const state = versionedData.data
      const newState = transformState(state)
      versionedData.data = newState
    } catch (err) {
      console.warn(`MetaMask Migration #${version}` + err.stack)
    }
    return Promise.resolve(versionedData)
  },
}

function transformState (state) {
  const newState = state
  delete newState.TOSHash
  delete newState.isDisclaimerConfirmed
  return newState
}
