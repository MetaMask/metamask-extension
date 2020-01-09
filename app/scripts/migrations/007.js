const version = 7

/*

This migration breaks out the TransactionManager substate

*/

import extend from 'xtend'

import clone from 'clone'

export default {
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
  const newState = extend(state, {
    TransactionManager: {
      transactions: state.transactions || [],
      gasMultiplier: state.gasMultiplier || 1,
    },
  })
  delete newState.transactions
  delete newState.gasMultiplier

  return newState
}
