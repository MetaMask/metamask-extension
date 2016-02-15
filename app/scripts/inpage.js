const XHR = window.XMLHttpRequest
// const fauxJax = require('faux-jax')
// fauxJax.install()
const Web3 = require('web3')
const createPayload = require('web3-provider-engine/util/create-payload')
const StreamProvider = require('./lib/stream-provider.js')
const LocalMessageDuplexStream = require('./lib/local-message-stream.js')

const RPC_URL = 'https://rawtestrpc.metamask.io/'


//
// setup plugin communication
//

var pluginStream = new LocalMessageDuplexStream({
  name: 'inpage',
  target: 'contentscript',
})
var remoteProvider = new StreamProvider()
remoteProvider.pipe(pluginStream).pipe(remoteProvider)

pluginStream.on('error', console.error.bind(console))
remoteProvider.on('error', console.error.bind(console))


//
// handle synchronous requests
//

// handle accounts cache
var accountsCache = []
setInterval(populateAccountsCache, 4000)
function populateAccountsCache(){
  remoteProvider.sendAsync(createPayload({
    method: 'eth_accounts',
    params: [],
    note: 'from metamask inpage provider',
  }), function(err, response){
    if (err) return console.error('MetaMask - Error polling accounts')
    // update localStorage
    var accounts = response.result
    if (accounts.toString() !== accountsCache.toString()) {
      accountsCache = accounts
      localStorage['MetaMask-Accounts'] = JSON.stringify(accounts)
    }
  })
}

// handle synchronous methods via standard http provider
var syncProvider = new Web3.providers.HttpProvider(RPC_URL)
remoteProvider.send = function(payload){
  var result = null
  switch (payload.method) {
    
    case 'eth_accounts':
      // read from localStorage
      accountsCache = JSON.parse(localStorage['MetaMask-Accounts'] || '[]')
      result = accountsCache
      break

    case 'eth_coinbase':
      // read from localStorage
      accountsCache = JSON.parse(localStorage['MetaMask-Accounts'] || '[]')
      result = accountsCache[0] || '0x0000000000000000000000000000000000000000'
      break

    // fallback to normal rpc
    default:
      return syncProvider.send(payload)

  }

  // return the result
  return {
    id: payload.id,
    jsonrpc: payload.jsonrpc,
    result: result,
  }
}

//
// global web3
//

var web3 = new Web3(remoteProvider)
window.web3 = web3
web3.setProvider = function(){
  console.log('MetaMask - overrode web3.setProvider')
}
console.log('MetaMask - injected web3')


//
// intercept local node requests
//


// console.log('MetaMask - intercepting localhost:8545 requests')

// fauxJax.on('request', function(req){
//   // check if local node request
//   if (req.requestURL.indexOf('localhost:8545') !== -1) {
//     var rpcReq = JSON.parse(req.requestBody)
//     if (req.async) {
//       remoteProvider.sendAsync(rpcReq, function(err, result){
//         // console.log('intercepted request (async):', rpcReq, result)
//         handleResult(result)
//       })
//     } else {
//       var result = remoteProvider.send(rpcReq)
//       // console.log('intercepted request (sync):', rpcReq, result)
//       handleResult(result)
//     }
//   } else {
//     // console.log('request continuing normally:', req.requestURL)
//     continueRequestNormally(req)
//   }

//   function handleResult(result){
//     var serializedResult = JSON.stringify(result)
//     req.respond(200, {
//       'content-type': 'application/json',
//     }, serializedResult)
//   }
// })

// function continueRequestNormally(req){
//   var xhr = new XHR()
//   // set target url and method
//   xhr.open(req.requestMethod, req.requestURL, req.async)
//   // set headers
//   Object.keys(req.requestHeaders || {}).forEach(function(headerKey){
//     xhr.setRequestHeader(headerKey, req.requestHeaders[headerKey])
//   })
//   // send and call completion handler
//   if (req.async) {
//     xhr.onload = copyResult
//     xhr.send(req.requestBody)
//   } else {
//     xhr.send(req.requestBody)
//     copyResult()
//   }

//   function copyResult() {
//     var headers = extractResponseHeaders(xhr.getAllResponseHeaders())
//     req.respond(xhr.status, headers, xhr.response)
//   }
// }

// function extractResponseHeaders(rawHeaders){
//   var headers = {}
//   var headerKeyValues = rawHeaders.split('\r\n').filter(Boolean)
//   headerKeyValues.forEach(function(keyValue){
//     var data = keyValue.split(': ')
//     headers[data[0]] = data[1]
//   })
//   return headers
// }
