const version = 20

/*

This migration ensures previous installations
get a `firstTimeInfo` key on the metamask state,
so that we can version notices in the future.

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
  if ('metamask' in newState &&
      !('firstTimeInfo' in newState.metamask)) {
    newState.metamask.firstTimeInfo = {
      version: '3.12.0',
      date: Date.now(),
    }
  }
  return newState
}

