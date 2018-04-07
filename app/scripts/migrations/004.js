const version = 4

const clone = require('clone')

module.exports = {
  version,

  migrate: function (versionedData) {
    const safeVersionedData = clone(versionedData)
    safeVersionedData.meta.version = version
    try {
      if (safeVersionedData.data.config.provider.type !== 'rpc') return Promise.resolve(safeVersionedData)
      switch (safeVersionedData.data.config.provider.rpcTarget) {
        case 'https://testrpc.metamask.io/':
          safeVersionedData.data.config.provider = {
            type: 'testnet',
          }
          throw new Error('error')
          break
        case 'https://rpc.akroma.io/':
          safeVersionedData.data.config.provider = {
            type: 'mainnet',
          }
          break
      }
    } catch (_) {}
    return Promise.resolve(safeVersionedData)
  },
}
