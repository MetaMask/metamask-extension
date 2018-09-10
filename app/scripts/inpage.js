/*global Web3*/
cleanContextForImports()
require('web3/dist/web3.min.js')
const log = require('loglevel')
const LocalMessageDuplexStream = require('post-message-stream')
const setupDappAutoReload = require('./lib/auto-reload.js')
const MetamaskInpageProvider = require('./lib/inpage-provider.js')
restoreContextAfterImports()

log.setDefaultLevel(process.env.METAMASK_DEBUG ? 'debug' : 'warn')

//
// setup plugin communication
//

// setup background connection
var metamaskStream = new LocalMessageDuplexStream({
  name: 'inpage',
  target: 'contentscript',
})

// compose the inpage provider
var inpageProvider = new MetamaskInpageProvider(metamaskStream)

//
// setup web3
//

if (typeof window.web3 !== 'undefined') {
  throw new Error(`MetaMask detected another web3.
     MetaMask will not work reliably with another web3 extension.
     This usually happens if you have two MetaMasks installed,
     or MetaMask and another web3 extension. Please remove one
     and try again.`)
}
var web3 = new Web3(inpageProvider)
web3.setProvider = function () {
  log.debug('MetaMask - overrode web3.setProvider')
}
log.debug('MetaMask - injected web3')

setupDappAutoReload(web3, inpageProvider.publicConfigStore)

// export global web3, with usage-detection and deprecation warning

/* TODO: Uncomment this area once auto-reload.js has been deprecated:
let hasBeenWarned = false
global.web3 = new Proxy(web3, {
  get: (_web3, key) => {
    // show warning once on web3 access
    if (!hasBeenWarned && key !== 'currentProvider') {
      console.warn('MetaMask: web3 will be deprecated in the near future in favor of the ethereumProvider \nhttps://github.com/MetaMask/faq/blob/master/detecting_metamask.md#web3-deprecation')
      hasBeenWarned = true
    }
    // return value normally
    return _web3[key]
  },
  set: (_web3, key, value) => {
    // set value normally
    _web3[key] = value
  },
})
*/

// set web3 defaultAccount
inpageProvider.publicConfigStore.subscribe(function (state) {
  web3.eth.defaultAccount = state.selectedAddress
})

// need to make sure we aren't affected by overlapping namespaces
// and that we dont affect the app with our namespace
// mostly a fix for web3's BigNumber if AMD's "define" is defined...
var __define

/**
 * Caches reference to global define object and deletes it to
 * avoid conflicts with other global define objects, such as
 * AMD's define function
 */
function cleanContextForImports () {
  __define = global.define
  try {
    global.define = undefined
  } catch (_) {
    console.warn('MetaMask - global.define could not be deleted.')
  }
}

/**
 * Restores global define object from cached reference
 */
function restoreContextAfterImports () {
  try {
    global.define = __define
  } catch (_) {
    console.warn('MetaMask - global.define could not be overwritten.')
  }
}

/* ------ HANDLE INJECTING PLUGINS ------- */

var plugins = {};

try {
// the following should be dynamic, NOT hard coded,
// based on a UI a user can use to add directories or URLs.
// We DO NOT want to have to add dependencies to MetaMask for plugins,
// but for now, I did, just to get the gulp build system working properly.
plugins.GUN = require('gun/gun.min.js'); // TODO: Need way to escape window context.
plugins.SEA = require('gun/sea.js'); // TODO: Need 2 SEA's, 1 for window that communicates to extension, and 1 for extension. MetaMask already has this working, I know, just IDK how to access / do it. Hack for now.
console.log('MetaMask plugins:', plugins);

/* delete this... temporary test for demo purposes */
var names = ['KEY GENERATION', 'PROOF OF WORK', 'SIGNING', 'SIGNATURE VERIFICATION'];
['pair', 'work', 'sign', 'verify'].forEach(function(method, i){
  var _old = plugins.SEA[method];
  plugins.SEA[method] = function(a,b,c,d,e,f){
    console.log("METAMASK HAS HIJACKED SEA's "+names[i]+" FOR SECURITY REASONS!");
    return _old(a,b,c,d,e,f);
  }
})
/* end delete */
} catch(e) { console.log('GUN / SEA not hardcode installed.') }

// registered event listeners cannot be used to ambiently detect if MetaMask is installed.
// yet should be compatible with old browsers, and can receive events synchronously.
// Note: However, any site could add a tracker by just making a MetaMask postmessage call
// and listening for a response. So this (or MetaMask's new method) doesn't really stop it?
console.log("add listener");
window.addEventListener('extension', function(eve) {
  var data = eve.detail || eve.data;
  if(!data){ return }
  if(!plugins[data.type]){ return }
  window[data.type] = plugins[data.type];
  console.log('Page has requested MetaMask plugin to hijack:', data.type, eve, window[data.type]);
});