const version = 4

module.exports = {
  version,  

  migrate: function (versionedData) {
    versionedData.meta.version = version
    try {
      if (versionedData.data.config.provider.type !== 'rpc') return Promise.resolve(versionedData)
      switch (versionedData.data.config.provider.rpcTarget) {
        case 'https://testrpc.metamask.io/':
          versionedData.data.config.provider = {
            type: 'testnet',
          }
          break
        case 'https://rpc.metamask.io/':
          versionedData.data.config.provider = {
            type: 'mainnet',
          }
          break
      }
    } catch (_) {}
    return Promise.resolve(versionedData)
  },
}
