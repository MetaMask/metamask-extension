const Web3 = require('web3')
const StreamProvider = require('./lib/stream-provider.js')
const LocalMessageDuplexStream = require('./lib/local-message-stream.js')


// setup plugin communication
var pluginStream = new LocalMessageDuplexStream({
  name: 'inpage',
  target: 'contentscript',
})
var remoteProvider = new StreamProvider()
remoteProvider.pipe(pluginStream).pipe(remoteProvider)

// create web3
var web3 = new Web3(remoteProvider)
window.web3 = web3
web3.setProvider = function(){}
console.log('Metamask injected web3')