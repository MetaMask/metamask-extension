const Web3 = require('web3')
const setupProvider = require('./lib/setup-provider.js')

//
// setup web3
//
console.log('hello world im here')
var provider = setupProvider()
hijackProvider(provider)
var web3 = new Web3(provider)
web3.setProvider = function(){
  console.log('MetaMask - overrode web3.setProvider')
}
console.log('metamask lib hijacked provider')

//
// export web3
//

global.web3 = web3

//
// ui stuff
//

var shouldPop = false
window.addEventListener('click', function(){
  if (!shouldPop) return
  shouldPop = false
  window.open('http://127.0.0.1:9001/popup/popup.html', '', 'width=360 height=500')
  console.log('opening window...')
})


function hijackProvider(provider){
  var _super = provider.sendAsync.bind(provider)
  provider.sendAsync = function(payload, cb){
    if (payload.method === 'eth_sendTransaction') {
      console.log('saw send')
      shouldPop = true
    }
    _super(payload, cb)
  }
}
