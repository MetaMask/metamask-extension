module.exports = {
  version: 2,

  migrate: function (data) {
    try {
      if (data.config.provider.type === 'etherscan') {
        data.config.provider.type = 'rpc'
        data.config.provider.rpcTarget = 'https://rpc.metamask.io/'
      }
    } catch (e) {}
    return data
  },
}
