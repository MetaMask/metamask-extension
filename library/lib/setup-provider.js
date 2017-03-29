const setupIframe = require('./setup-iframe.js')
const MetamaskInpageProvider = require('../../app/scripts/lib/inpage-provider.js')

module.exports = getProvider


function getProvider(){

  if (global.web3) {
    console.log('MetaMask ZeroClient - using environmental web3 provider')
    return global.web3.currentProvider
  }
  console.log('MetaMask ZeroClient - injecting zero-client iframe!')
  var iframeStream = setupIframe({
    zeroClientProvider: 'http://localhost:9001',
    sandboxAttributes: ['allow-scripts', 'allow-popups', 'allow-same-origin'],
    container: document.body,
  })

  var inpageProvider = new MetamaskInpageProvider(iframeStream)
  console.log('ABOUT TO RETURN INPAGE')
  return inpageProvider

}
