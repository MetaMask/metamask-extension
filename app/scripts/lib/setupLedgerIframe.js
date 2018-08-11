const extension = require('extensionizer')
module.exports = setupLedgerIframe
/**
 * Injects an iframe into the current document to 
 * enable the interaction with ledger devices
 */
function setupLedgerIframe () {
    const ORIGIN  = 'http://localhost:9000'
    const ledgerIframe = document.createElement('iframe')
    ledgerIframe.src = ORIGIN
    console.log('Injecting ledger iframe')
    document.head.appendChild(ledgerIframe)
  
      console.log('[LEDGER]: LEDGER BG LISTENER READY')
      extension.runtime.onMessage.addListener(({action, params}) => {
          console.log('[LEDGER]: GOT MSG FROM THE KEYRING', action, params)
          if (action.search('ledger-') !== -1) {
              //Forward messages from the keyring to the iframe
              sendMessage({action, params})
          }
      })
  
      function sendMessage(msg) {
        ledgerIframe.contentWindow.postMessage({...msg, target: 'LEDGER-IFRAME'}, '*')
      }
    
     /*
    Passing messages from iframe to background script
    */
    console.log('[LEDGER]: LEDGER FROM-IFRAME LISTENER READY')
    window.addEventListener('message', event => {
        if(event.origin !== ORIGIN) return false
        if (event.data && event.data.action && event.data.action.search('ledger-') !== -1) {
          // Forward messages from the iframe to the keyring
          console.log('[LEDGER] : forwarding msg', event.data)
          extension.runtime.sendMessage(event.data)
        }
    })
  
  }