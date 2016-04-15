const XHR = window.XMLHttpRequest

// bring in web3 but rename on window
const Web3 = require('web3')
delete window.Web3
window.MetamaskWeb3 = Web3

const createPayload = require('web3-provider-engine/util/create-payload')
const StreamProvider = require('./lib/stream-provider.js')
const LocalMessageDuplexStream = require('./lib/local-message-stream.js')

const RPC_URL = 'https://testrpc.metamask.io/'


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
// global web3
//

var web3 = new Web3(remoteProvider)
window.web3 = web3
web3.setProvider = function(){
  console.log('MetaMask - overrode web3.setProvider')
}
console.log('MetaMask - injected web3')


//
// handle synchronous requests
//

// handle accounts cache
var accountsCache = JSON.parse(localStorage['MetaMask-Accounts'] || '[]')
web3.eth.defaultAccount = accountsCache[0]

setInterval(populateAccountsCache, 4000)
function populateAccountsCache(){
  remoteProvider.sendAsync(createPayload({
    method: 'eth_accounts',
    params: [],
    isMetamaskInternal: true,
  }), function(err, response){
    if (err) return console.error('MetaMask - Error polling accounts')
    // update localStorage
    var accounts = response.result
    if (accounts.toString() !== accountsCache.toString()) {
      accountsCache = accounts
      web3.eth.defaultAccount = accountsCache[0]
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
      result = accountsCache
      break

    case 'eth_coinbase':
      // read from localStorage
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

