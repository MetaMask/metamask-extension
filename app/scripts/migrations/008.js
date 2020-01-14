const version = 8

/*

This migration breaks out the NoticeController substate

*/

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
  const newState = {
    ...state,
    NoticeController: {
      noticesList: state.noticesList || [],
    },
  }
  delete newState.noticesList

  return newState
}
