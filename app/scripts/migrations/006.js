const version = 6

/*

This migration moves KeyringController.selectedAddress to PreferencesController.selectedAddress

*/

const extend = require('xtend')
const clone = require('clone')

module.exports = {
  version,

  migrate: function (originalVersionedData) {
    const versionedData = clone(originalVersionedData)
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
  const keyringSubstate = state.KeyringController

  // add new state
  const newState = extend(state, {
    PreferencesController: {
      selectedAddress: keyringSubstate.selectedAccount,
    },
  })

  // rm old state
  delete newState.KeyringController.selectedAccount

  return newState
}
