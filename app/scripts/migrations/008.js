const version = 8

/*

This migration breaks out the NoticeController substate

*/

const extend = require('xtend')

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
  const newState = extend(state, {
    NoticeController: {
      noticesList: state.noticesList || [],
    },
  })
  delete newState.noticesList

  return newState
}
