const web3 = require('web3')
const MetamaskProvider = require('./lib/metamask-provider.js')

const rpcUrl = 'https://rpc.metamask.io'


var provider = new MetamaskProvider(forwardPayload, rpcUrl)
web3.setProvider(provider)

// injecting web3
window.web3 = web3

function forwardPayload(){
  debugger
}