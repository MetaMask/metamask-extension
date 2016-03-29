const xhr = process.browser ? require('xhr') : require('request')
const inherits = require('util').inherits
const createPayload = require('../util/create-payload.js')

module.exports = EtherScanProvider

function EtherScanProvider(opts) {

  this.url = opts.url || 'http://testnet.etherscan.io/api?module=proxy&'

}

EtherScanProvider.prototype.setEngine = function(engine) {
  const self = this
  self.engine = engine
  engine.on('block', function(block) {
    self.currentBlock = block
  })
}

EtherScanProvider.prototype.handleRequest = function(payload, next, end) {

  const self = this
  var method = payload.method
  var targetUrl = self.rpcUrl + 'action=' + method
  var params = payload.params

  var newPayload = createPayload(payload)

  xhr({
    uri: targetUrl,
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newPayload),
    rejectUnauthorized: false,
  }, function(err, res, body) {
    if (err) return end(err)

    // parse response into raw account
    var data
    try {
      data = JSON.parse(body)
      if (data.error) return end(data.error)
    } catch (err) {
      console.error(err.stack)
      return end(err)
    }

    // console.log('network:', payload.method, payload.params, '->', data.result)

    end(null, data.result)
  })

}

EtherScanProvider.prototype.emitPayload = function(payload, cb){
  const self = this
  self.engine.sendAsync(createPayload(payload), cb)
}
