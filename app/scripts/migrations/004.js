const version = 4

import clone from 'clone'

export default {
  version,

  migrate: function (versionedData) {
    const safeVersionedData = clone(versionedData)
    safeVersionedData.meta.version = version
    try {
      if (safeVersionedData.data.config.provider.type !== 'rpc') {
        return Promise.resolve(safeVersionedData)
      }
      switch (safeVersionedData.data.config.provider.rpcTarget) {
        case 'https://testrpc.metamask.io/':
          safeVersionedData.data.config.provider = {
            type: 'testnet',
          }
          break
        case 'https://rpc.metamask.io/':
          safeVersionedData.data.config.provider = {
            type: 'mainnet',
          }
          break
        // No default
      }
    } catch (_) {}
    return Promise.resolve(safeVersionedData)
  },
}
