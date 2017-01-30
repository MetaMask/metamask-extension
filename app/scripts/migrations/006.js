const version = 6

/*

This migration moves KeyringController.selectedAddress to PreferencesController.selectedAddress

*/

const extend = require('xtend')

module.exports = {
  version,  

  migrate: function (versionedData) {
    versionedData.meta.version = version
    try {
      const state = versionedData.data
      const newState = migrateState(state)
      versionedData.data = newState
    } catch (err) {
      console.warn(`MetaMask Migration #${version}` + err.stack)
    }
    return Promise.resolve(versionedData)
  },
}

function migrateState (state) {
  const config = state.config

  // add new state
  const newState = extend(state, {
    PreferencesController: {
      selectedAddress: config.selectedAccount,
    },
  })

  // rm old state
  delete newState.KeyringController.selectedAccount

  return newState
}
