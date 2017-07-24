const Web3 = require('web3')
const setupProvider = require('./lib/setup-provider.js')
const setupDappAutoReload = require('../../app/scripts/lib/auto-reload.js')
const MASCARA_ORIGIN = process.env.MASCARA_ORIGIN || 'http://localhost:9001'
console.log('MASCARA_ORIGIN:', MASCARA_ORIGIN)

//
// setup web3
//

const provider = setupProvider({
  mascaraUrl: MASCARA_ORIGIN + '/proxy/',
})

provider.isMascara = true

instrumentForUserInteractionTriggers(provider)

const web3 = new Web3(provider)
setupDappAutoReload(web3, provider.publicConfigStore)
//
// ui stuff
//

let shouldPop = false
window.addEventListener('click', maybeTriggerPopup)

//
// util
//
function maybeTriggerPopup(){
  if (!shouldPop) return
  shouldPop = false
  window.open(MASCARA_ORIGIN, '', 'width=360 height=500')
  console.log('opening window...')
}

function instrumentForUserInteractionTriggers(provider){
  const _super = provider.sendAsync.bind(provider)
  provider.sendAsync = function(payload, cb){
    if (payload.method === 'eth_sendTransaction') {
      console.log('saw send')
      shouldPop = true
    }
    _super(payload, cb)
  }
}


