const version = 3
const oldTestRpc = 'https://rawtestrpc.metamask.io/'
const newTestRpc = 'https://testrpc.metamask.io/'

module.exports = {
  version,

  migrate: function (meta) {
    meta.version = version
    try {
      if (meta.data.config.provider.rpcTarget === oldTestRpc) {
        meta.data.config.provider.rpcTarget = newTestRpc
      }
    } catch (e) {}
    return Promise.resolve(meta)
  },
}
