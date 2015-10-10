const web3 = require('web3')
const BlockAppsWeb3Provider = require('blockapps-web3')
const Transaction = require('ethereumjs-tx')
require('object.entries').shim()

// const rpcUrl = 'https://rpc.metamask.io'

// var provider = new MetamaskProvider(forwardPayload, rpcUrl)
var provider = new BlockAppsWeb3Provider({
  host: 'http://hacknet.blockapps.net',
  // host: 'http://api.blockapps.net',
  transaction_signer: { 
    // Can be any object that implements the following methods:
    hasAddress: function(address, callback) {
      console.log('metamask provider - asked for address ownership', address)
      callback(null, true)
    },
    signTransaction: function(txParams, callback) {
      txParams.gasLimit = txParams.gas
      var tx = new Transaction(txParams)
      tx.sign(new Buffer('0d0ba14043088cd629a978b49c8691deca5926f0271432bc0064e4745bac0a9f', 'hex'))
      callback(null, '0x'+tx.serialize().toString('hex'))
    },
  },
  coinbase: '0x00000000000',
  accounts: ['0x985095ef977ba75fb2bb79cd5c4b84c81392dff6'],
  // host: function(){ debugger },
});

const documentOrigin = window.location.origin
const allowedMessageTarget = 'metamask'
const allowedMessageType = 'addUnsignedTx'

web3.setProvider(provider)
// disable setProvider
web3.setProvider = function(){}

// injecting web3
console.log('Metamask injected web3')


// log all the stuff!
// provider.verbosity = 1

// web3.currentProvider.vm.onStep = function(data, cb){
//   console.log(data)
//   cb()
// }

window.web3 = web3


function forwardPayload(payload){
  window.postMessage({
    to: allowedMessageTarget,
  	type: allowedMessageType,
  	payload: payload,
  }, documentOrigin)
}