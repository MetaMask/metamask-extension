const version = 2

const clone = require('clone')


module.exports = {
  version,

  migrate: function (originalVersionedData) {
    const versionedData = clone(originalVersionedData)
    versionedData.meta.version = version
    try {
      if (versionedData.data.config.provider.type === 'etherscan') {
        versionedData.data.config.provider.type = 'rpc'
        versionedData.data.config.provider.rpcTarget = 'https://rpc.akroma.io/'
      }
    } catch (e) {}
    return Promise.resolve(versionedData)
  },
}
