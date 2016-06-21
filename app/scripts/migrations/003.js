var oldTestRpc = 'https://rawtestrpc.metamask.io/'
var newTestRpc = 'https://testrpc.metamask.io/'

module.exports = {
  version: 3,

  migrate: function (data) {
    try {
      if (data.config.provider.rpcTarget === oldTestRpc) {
        data.config.provider.rpcTarget = newTestRpc
      }
    } catch (e) {}
    return data
  },
}
