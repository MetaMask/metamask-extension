const Web3 = require('web3')
const setupProvider = require('./lib/setup-provider.js')

const MASACARA_DOMAIN = 'http://localhost:9001'

//
// setup web3
//

var provider = setupProvider({
  mascaraUrl: MASACARA_DOMAIN + '/proxy/',
})
instrumentForUserInteractionTriggers(provider)

var web3 = new Web3(provider)
web3.setProvider = function(){
  console.log('MetaMask - overrode web3.setProvider')
}

//
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
  window.open(MASACARA_DOMAIN, '', 'width=360 height=500')
  console.log('opening window...')
})


function instrumentForUserInteractionTriggers(provider){
  var _super = provider.sendAsync.bind(provider)
  provider.sendAsync = function(payload, cb){
    if (payload.method === 'eth_sendTransaction') {
      console.log('saw send')
      shouldPop = true
    }
    _super(payload, cb)
  }
}


