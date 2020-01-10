const version = 3
const oldTestRpc = 'https://rawtestrpc.metamask.io/'
const newTestRpc = 'https://testrpc.metamask.io/'

import clone from 'clone'

export default {
  version,

  migrate: function (originalVersionedData) {
    const versionedData = clone(originalVersionedData)
    versionedData.meta.version = version
    try {
      if (versionedData.data.config.provider.rpcTarget === oldTestRpc) {
        versionedData.data.config.provider.rpcTarget = newTestRpc
      }
    } catch (e) {}
    return Promise.resolve(versionedData)
  },
}
