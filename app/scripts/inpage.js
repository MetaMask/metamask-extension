/*global Web3*/
cleanContextForImports()
require('web3/dist/web3.min.js')
const log = require('loglevel')
const LocalMessageDuplexStream = require('post-message-stream')
const setupDappAutoReload = require('./lib/auto-reload.js')
const MetamaskInpageProvider = require('metamask-inpage-provider')
restoreContextAfterImports()

log.setDefaultLevel(process.env.METAMASK_DEBUG ? 'debug' : 'warn')

console.warn('ATTENTION: In an effort to improve user privacy, MetaMask will ' +
'stop exposing user accounts to dapps by default beginning November 2nd, 2018. ' +
'Dapps should call provider.enable() in order to view and use accounts. Please see ' +
'https://bit.ly/2QQHXvF for complete information and up-to-date example code.')

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

// Augment the provider with its enable method
inpageProvider.enable = function (options = {}) {
  return new Promise((resolve, reject) => {
    if (options.mockRejection) {
      reject('User rejected account access')
    } else {
      inpageProvider.sendAsync({ method: 'eth_accounts', params: [] }, (error, response) => {
        if (error) {
          reject(error)
        } else {
          resolve(response.result)
        }
      })
    }
  })
}

window.ethereum = inpageProvider

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
var rand = function(){ return Math.ceil(Math.random()*10000) }
// the following should be dynamic, NOT hard coded,
// based on a UI a user can use to add directories or URLs.
// We DO NOT want to have to add dependencies to MetaMask for plugins,
// but for now, I did, just to get the gulp build system working properly.

/* only SEA proxy shim needed */
/* keeps things lightweight */
/* no dependency is loaded! */
plugins.SEA = {};

// NOTE: SEA should actually be core, not considered a plugin!
// It is what other plugins would use as their metamask crypto API.

// move this to its own file...
var n1 = ['PROOF OF WORK', 'ENCRYPTION', 'DECRYPTION', 'SIGNING', 'SIGNATURE VERIFICATION', 'SECRET SHARING'];
['work', 'encrypt', 'decrypt', 'sign', 'verify', 'secret'].forEach(function(method, i){
  plugins.SEA[method] = function(data, pair, cb, opt){
    log.debug("METAMASK HAS HIJACKED SEA's "+n1[i]+" FOR SECURITY REASONS!");
    // NOTE: SEA's official API is callback, not Promise. 
    return new Promise(function(res, rej){ // Should be callback style, temporary for now.
      cb = cb || function(){};
      pair = (pair instanceof Function)? undefined : pair;
      var put = {data: data, pair: pair, opt: opt};
      inpageProvider.sendAsync({jsonrpc:'2.0', method: 'SEA_'+method, put: put}, function(a,b,c){
        if(b.err || b.error){
          log.debug(b.err || b.error);
          plugins.SEA.err = b.err || b.error;
          cb(); res(); // rej() is handled by SEA, not the plugin.
          return;
        }
        cb(b.ack); res(b.ack);
    })});
  }
});
var n2 = ['NAMING', 'KEY GENERATION'];
['name', 'pair'].forEach(function(method, i){
  plugins.SEA[method] = function(cb, opt){
    log.debug("METAMASK HAS HIJACKED SEA's "+n2[i]+" FOR SECURITY REASONS!");
    // NOTE: SEA's official API is callback, not Promise. 
    return new Promise(function(res, rej){ // Should be callback style, temporary for now.
      cb = cb || function(){};
      var get = {opt: opt};
      inpageProvider.sendAsync({jsonrpc:'2.0', method: 'SEA_'+method, get: get}, function(a,b,c){
        if(b.err || b.error){
          log.debug(b.err || b.error);
          plugins.SEA.err = b.err || b.error;
          cb(); res(); // rej() is handled by SEA, not the plugin.
          return;
        }
        cb(b.ack); res(b.ack);
    })});
  }
});

log.debug('MetaMask plugins:', plugins);
// end delete
} catch(e) { log.debug(e) }

Object.keys(plugins).forEach(function(plugin){
  window[plugin] = plugins[plugin];
  log.debug('MetaMask has provided the plugin:', plugin);
})