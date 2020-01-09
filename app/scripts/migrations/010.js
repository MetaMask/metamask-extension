const version = 10

/*

This migration breaks out the ShapeShiftController substate

*/

import merge from 'deep-extend'

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
  const newState = merge({}, state, {
    ShapeShiftController: {
      shapeShiftTxList: state.shapeShiftTxList || [],
    },
  })
  delete newState.shapeShiftTxList

  return newState
}
