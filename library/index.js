const Web3 = require('web3')
const setupProvider = require('./lib/setup-provider.js')

//
// setup web3
//

var provider = setupProvider()
hijackProvider(provider)
var web3 = new Web3(provider)
web3.setProvider = function(){
  console.log('MetaMask - overrode web3.setProvider')
}

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
  window.open('popup.html', '', 'width=1000')
  console.log('opening window...')
})


function hijackProvider(provider){
  var _super = provider.sendAsync.bind(provider)
  provider.sendAsync = function(payload, cb){
    if (payload.method === 'eth_sendTransaction') {
      shouldPop = true
    }
    _super(payload, cb)
  }
}