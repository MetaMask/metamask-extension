const web3 = require('web3')
const MetamaskProvider = require('./metamask-provider.js')


var provider = new MetamaskProvider(forwardPayload, 'https://rpc.metamask.io')
web3.setProvider(provider)

console.log('injecting web3....')
window.web3 = web3


function forwardPayload(){
  debugger
}