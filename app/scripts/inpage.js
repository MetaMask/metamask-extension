const web3 = require('web3')
const MetamaskProvider = require('./lib/metamask-provider.js')

const rpcUrl = 'https://rpc.metamask.io'
const documentOrigin = window.location.origin
const allowedMessageTarget = 'metamask'
const allowedMessageType = 'addUnsignedTx'


var provider = new MetamaskProvider(forwardPayload, rpcUrl)
web3.setProvider(provider)

// injecting web3
console.log('Metamask injected web3')
window.web3 = web3

function forwardPayload(payload){
  window.postMessage({
    to: allowedMessageTarget,
  	type: allowedMessageType,
  	payload: payload,
  }, documentOrigin)
}