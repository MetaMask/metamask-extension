const version = 2

module.exports = {
  version,

  migrate: function (versionedData) {
    versionedData.meta.version = version
    try {
      if (versionedData.data.config.provider.type === 'etherscan') {
        versionedData.data.config.provider.type = 'rpc'
        versionedData.data.config.provider.rpcTarget = 'https://rpc.metamask.io/'
      }
    } catch (e) {}
    return Promise.resolve(versionedData)
  },
}
