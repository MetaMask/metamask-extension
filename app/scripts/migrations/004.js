module.exports = {
  version: 4,

  migrate: function(data) {
    try {
      if (data.config.provider.type !== 'rpc') return data
      switch (data.config.provider.rpcTarget) {
        case 'https://testrpc.metamask.io/':
            data.config.provider = {
              type: 'testnet'
            }
          break
        case 'https://rpc.metamask.io/':
            data.config.provider = {
              type: 'mainnet'
            }
          break
      }
    } catch (_) {}
    return data
  }
}
