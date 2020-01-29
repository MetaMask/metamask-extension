// next version number
const version = 0

/*

description of migration and what it does

*/

import { cloneDeep } from 'lodash'

export default {
  version,

  migrate: async function (originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData)
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
  return newState
}
