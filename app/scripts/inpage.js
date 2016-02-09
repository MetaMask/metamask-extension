const Web3 = require('web3')
const createPayload = require('web3-provider-engine/util/create-payload')
const StreamProvider = require('./lib/stream-provider.js')
const LocalMessageDuplexStream = require('./lib/local-message-stream.js')


// setup plugin communication
var pluginStream = new LocalMessageDuplexStream({
  name: 'inpage',
  target: 'contentscript',
})
var remoteProvider = new StreamProvider()
remoteProvider.pipe(pluginStream).pipe(remoteProvider)

// handle synchronous methods remotely

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

var syncProvider = new Web3.providers.HttpProvider('https://rawtestrpc.metamask.io/')
// var unsupportedMethods = ['eth_accounts']
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

// create web3
var web3 = new Web3(remoteProvider)
window.web3 = web3
web3.setProvider = function(){
  console.log('MetaMask Extension - overrode web3.setProvider')
}
console.log('MetaMask Extension - injected web3')