var HttpProvider = require('web3/lib/web3/httpprovider.js')
var ethUtils = require('ethereumjs-util')
var async = require('async')

module.exports = MetamaskProvider


function MetamaskProvider(forwardPayload, host) {
  this.handlers = []
  this.forwardPayload = forwardPayload
  this.http = new HttpProvider(host)
}

MetamaskProvider.prototype.send = function (payload) {
  if (Array.isArray(payload)) {
    return payload.map( this.handlePayload.bind(this) )
  } else {
    return this.handlePayload( payload )
  }
}

MetamaskProvider.prototype.sendAsync = function (payload, cb) {
  if (Array.isArray(payload)) {
    async.map( payload, this.handlePayload.bind(this), cb )
  } else {
    this.handlePayload( payload, cb )
  }
}

MetamaskProvider.prototype.handlePayload = function (payload, cb) {
  var _this = this
  var isSync = !cb
  var resolvedSync = true
  var result = undefined

  // TODO - this should be injected from Vapor dapp starts
  var exposedAccounts = ['0xa06ef3ed1ce41ade87f764de6ce8095c569d6d57']

  switch (payload.method) {
    
    case 'web3_sha3':
      var inputHex = stripHexStringPrefix(payload.params[0])
      var hash = '0x'+ethUtils.sha3(new Buffer(inputHex, 'hex')).toString('hex')
      return handleResult(null, wrapResponse(payload, hash))
    
    case 'eth_sendTransaction':
      this.forwardPayload(payload)
      return handleResult(null, wrapResponse(payload, ''))

    case 'eth_coinbase':
      var currentAddress = exposedAccounts[0]
      return handleResult(null, wrapResponse(payload, currentAddress))

    case 'eth_accounts':
      return handleResult(null, wrapResponse(payload, exposedAccounts))

    case 'eth_gasPrice':
      // TODO - this should be dynamically set somehow
      var gasPrice = '0x01'
      return handleResult(null, wrapResponse(payload, [gasPrice]))

    case 'eth_call':
      var params = payload.params
      // default 'from' to default account
      var args = params[0]
      if (!args.from) {
        var currentAddress = exposedAccounts[0]
        args.from = currentAddress
      }
      // default block to latest
      params[1] = params[1] || 'latest'
      // turn on debug trace
      params[2] = global.DEBUG_RPC
      return handleNormally()
    
    default:
      return handleNormally()
  }

  resolvedSync = false

  function handleNormally(){
    if (isSync) {
      return handleResult(null, _this.http.send(payload))
    } else {
      _this.http.sendAsync(payload, handleResult)
    }
  }

  // helper for normalizing handling of sync+async responses
  function handleResult(err, resp) {
    if (isSync) {
      return resp
    } else {
      if (resolvedSync) {
        process.nextTick(cb.bind(null, err, resp))
      } else {
        cb(err, resp)
      }
    }
  }
}

function wrapResponse(payload, result){
  return {
    jsonrpc: payload.jsonrpc,
    id: payload.id,
    result: result,
  }
}

function stripHexStringPrefix(hex) {
  if (!hex) {
    return hex
  }

  if (hex.slice(0, 2) === '0x') {
    return hex.slice(2);
  } else {
    return hex;
  }
}