const version = 2

module.exports = {
  version,

  migrate: function (meta) {
    meta.version = version
    try {
      if (meta.data.config.provider.type === 'etherscan') {
        meta.data.config.provider.type = 'rpc'
        meta.data.config.provider.rpcTarget = 'https://rpc.metamask.io/'
      }
    } catch (e) {}
    return Promise.resolve(meta)
  },
}
