const version = 26

/*

This migration moves the identities stored in the KeyringController
 into the PreferencesController

*/

const clone = require('clone')

module.exports = {
  version,
  migrate (originalVersionedData) {
    const versionedData = clone(originalVersionedData)
    versionedData.meta.version = version
    try {
      const state = versionedData.data
      versionedData.data = transformState(state)
    } catch (err) {
      console.warn(`MetaMask Migration #${version}` + err.stack)
      return Promise.reject(err)
    }
    return Promise.resolve(versionedData)
  },
}

function transformState (state) {
  if (!state.KeyringController || !state.PreferencesController) {
    return state
  }

  if (!state.KeyringController.walletNicknames) {
    return state
  }

  state.PreferencesController.identities = Object.keys(state.KeyringController.walletNicknames)
    .reduce((identities, address) => {
      identities[address] = {
        name: state.KeyringController.walletNicknames[address],
        address,
      }
      return identities
    }, {})
  delete state.KeyringController.walletNicknames
  return state
}
