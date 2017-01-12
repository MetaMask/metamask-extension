const version = 4

module.exports = {
  version,  

  migrate: function (meta) {
    meta.version = version
    try {
      if (meta.data.config.provider.type !== 'rpc') return Promise.resolve(meta)
      switch (meta.data.config.provider.rpcTarget) {
        case 'https://testrpc.metamask.io/':
          meta.data.config.provider = {
            type: 'testnet',
          }
          break
        case 'https://rpc.metamask.io/':
          meta.data.config.provider = {
            type: 'mainnet',
          }
          break
      }
    } catch (_) {}
    return Promise.resolve(meta)
  },
}
