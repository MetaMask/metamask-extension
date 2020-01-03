const OriginalMetamaskInpageProvider = require('metamask-inpage-provider')

class MetamaskInpageProvider extends OriginalMetamaskInpageProvider {
  requestId () {
    return `${Date.now()}${Math.random()
      .toFixed(7)
      .substring(2)}`
  }

  async call (method, ...params) {
    const payload = { method, params, jsonrpc: '2.0', id: this.requestId() }
    return new Promise((resolve, reject) => {
      this.sendAsync(payload, (error, result) => {
        if (error) {
          reject(error)
        }
        resolve(result)
      })
    })
  }
}

module.exports = MetamaskInpageProvider
