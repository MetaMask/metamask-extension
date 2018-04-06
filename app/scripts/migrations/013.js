const version = 13

/*

This migration modifies the network config from ambiguous 'testnet' to explicit 'ropsten'

*/

const clone = require('clone')

module.exports = {
  version,

  migrate: function (originalVersionedData) {
    const versionedData = clone(originalVersionedData)
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
  const { config } = newState
  if ( config && config.provider ) {
    if (config.provider.type === 'testnet') {
      newState.config.provider.type = 'ropsten'
    }
  }
  return newState
}
