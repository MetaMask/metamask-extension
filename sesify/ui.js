
// these are used for global detection by some modules
const safeObjects = sesEval('({ Object, Symbol })')

const defaultGlobals = Object.assign({}, getAndBindGlobals(['console', 'atob', 'btoa', 'setTimeout', 'clearTimeout', 'clearInterval', 'setInterval']), safeObjects)
const moduleGlobals = {}
const depConfig = {}

function getAndBindGlobals (globalNames) {
  const selectedGlobals = {}
  globalNames.forEach(glob => {
    let value = self[glob]
    if (!value) return
    // necesary for 'setTimeout' etc
    if (typeof value === 'function') value = value.bind(window)
    selectedGlobals[glob] = value
  })
  return selectedGlobals
}

function exposeToModule (moduleName, globalNames) {
  const globalsToExpose = getAndBindGlobals(globalNames)
  moduleGlobals[moduleName] = Object.assign({}, defaultGlobals, globalsToExpose)
}

function exposeToDep (moduleName, depPath) {
  depConfig[depPath] = { $: moduleGlobals[moduleName] }
}

// set per-module globals config
exposeToModule('@material-ui/core', ['window'])
exposeToModule('@sentry/browser', ['DOMError', 'DOMException', 'ErrorEvent', 'Headers', 'Request', 'Response', 'XMLHttpRequest', 'document', 'window'])
exposeToModule('@sentry/utils', ['window'])
exposeToModule('@zxing/library', ['TextDecoder', 'TextEncoder', 'document', 'navigator', 'window'])
exposeToModule('web3', ['window', 'XMLHttpRequest'])
exposeToModule('assert', ['window'])
exposeToModule('async', ['window'])
exposeToModule('bignumber.js', ['crypto'])
exposeToModule('boron', ['window'])
exposeToModule('brorand', ['window'])
exposeToModule('vm-browserify', ['document', 'eval'])
exposeToModule('c3', ['MutationObserver', 'document', 'window'])
exposeToModule('classnames', ['window'])
exposeToModule('copy-to-clipboard', ['document', 'navigator', 'window'])
exposeToModule('core-js', ['window', 'document', 'postMessage', 'PromiseRejectionEvent'])
exposeToModule('css-vendor', ['document', 'window'])
exposeToModule('d3-fetch', ['DOMParser', 'Image', 'fetch'])
exposeToModule('d3-interpolate', ['document'])
exposeToModule('d3-selection', ['document'])
exposeToModule('d3-timer', ['performance', 'window'])
exposeToModule('d3-zoom', ['SVGElement'])
exposeToModule('detect-node', ['window'])
exposeToModule('detectrtc', ['MediaStreamTrack', 'RTCIceGatherer', 'WebSocket', 'document', 'location', 'mozRTCPeerConnection', 'screen', 'webkitMediaStream', 'webkitRTCPeerConnection', 'window'])
exposeToModule('dom-helpers', ['document', 'window'])
exposeToModule('domkit', ['document', 'window'])
exposeToModule('js-sha3', ['window', 'navigator'])
exposeToModule('eth-ens-namehash', ['name'])
exposeToModule('readable-stream', ['window'])
exposeToModule('extensionizer', ['browser', 'chrome', 'window'])
exposeToModule('fbjs', ['Worker', 'window', 'document'])
exposeToModule('history', ['navigator', 'window'])
exposeToModule('inject-css', ['document'])
exposeToModule('is-dom', ['window'])
exposeToModule('is-in-browser', ['document', 'window'])
exposeToModule('jazzicon', ['document'])
exposeToModule('jss', ['document', 'window'])
exposeToModule('lodash.debounce', ['window'])
exposeToModule('lodash.shuffle', ['window'])
exposeToModule('lodash', ['window'])
exposeToModule('loglevel', ['window'])
exposeToModule('luxon', ['Intl'])
exposeToModule('metamask-logo', ['document', 'window'])
exposeToModule('pbkdf2', ['window'])
exposeToModule('popper.js', ['Node', 'cancelAnimationFrame', 'document', 'getComputedStyle', 'navigator', 'requestAnimationFrame', 'window'])
exposeToModule('punycode', ['window'])
exposeToModule('randombytes', ['window'])
exposeToModule('randomfill', ['window'])
exposeToModule('raphael', ['ActiveXObject', 'DocumentTouch', 'document', 'window'])
exposeToModule('react-dom', ['document', 'window', 'navigator', 'performance', 'MSApp'])
exposeToModule('react-event-listener', ['window'])
exposeToModule('react-input-autosize', ['window'])
exposeToModule('react-inspector', ['Node'])
exposeToModule('react-media', ['window'])
exposeToModule('react-select', ['window', 'document'])
exposeToModule('react-simple-file-input', ['window'])
exposeToModule('react-tippy', ['Element', 'MutationObserver', 'document', 'getComputedStyle', 'navigator', 'performance', 'window'])
exposeToModule('react-toggle-button', ['performance', 'window'])
exposeToModule('react-tooltip-component', ['document', 'window'])
exposeToModule('redux-logger', ['performance', 'window'])
exposeToModule('rtcpeerconnection-shim', ['Event', 'document'])
exposeToModule('symbol-observable', ['window'])
exposeToModule('textarea-caret', ['document', 'getComputedStyle', 'window'])
exposeToModule('timers-browserify', ['window'])
exposeToModule('toggle-selection', ['document'])
exposeToModule('utf8', ['window'])
exposeToModule('util-deprecate', ['window'])
exposeToModule('util', ['window'])
exposeToModule('webrtc-adapter', ['window', 'DOMException', 'Event', 'RTCSessionDescription', 'navigator'])
exposeToModule('xhr2', ['XMLHttpRequest'])
// set in dep graph
// depGraph goes here
exposeToDep('@material-ui/core', '@material-ui/core')
exposeToDep('@sentry/browser', '@sentry/browser')
exposeToDep('@sentry/utils', '@sentry/browser @sentry/core @sentry/utils')
exposeToDep('@sentry/utils', '@sentry/browser @sentry/core @sentry/hub @sentry/utils')
exposeToDep('@sentry/utils', '@sentry/browser @sentry/core @sentry/minimal @sentry/hub @sentry/utils')
exposeToDep('@zxing/library', '@zxing/library')
exposeToDep('web3', 'abi-decoder web3')
exposeToDep('assert', 'assert')
exposeToDep('assert', 'ethereumjs-util assert')
exposeToDep('assert', 'ethereumjs-abi ethereumjs-util assert')
exposeToDep('assert', 'ethereumjs-util rlp assert')
exposeToDep('assert', 'ethereumjs-abi ethereumjs-util rlp assert')
exposeToDep('async', 'async')
exposeToDep('async', 'eth-token-tracker eth-block-tracker async-eventemitter async')
exposeToDep('bignumber.js', 'abi-decoder web3 bignumber.js')
exposeToDep('bignumber.js', 'bignumber.js')
exposeToDep('boron', 'boron')
exposeToDep('brorand', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign elliptic brorand')
exposeToDep('brorand', 'bignumber.js crypto-browserify browserify-sign elliptic brorand')
exposeToDep('brorand', 'abi-decoder web3 bignumber.js crypto-browserify create-ecdh elliptic brorand')
exposeToDep('brorand', 'bignumber.js crypto-browserify create-ecdh elliptic brorand')
exposeToDep('brorand', 'ethereumjs-util secp256k1 elliptic brorand')
exposeToDep('brorand', 'ethereumjs-abi ethereumjs-util secp256k1 elliptic brorand')
exposeToDep('brorand', 'abi-decoder web3 bignumber.js crypto-browserify diffie-hellman miller-rabin brorand')
exposeToDep('brorand', 'bignumber.js crypto-browserify diffie-hellman miller-rabin brorand')
exposeToDep('vm-browserify', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign parse-asn1 asn1.js vm-browserify')
exposeToDep('vm-browserify', 'bignumber.js crypto-browserify browserify-sign parse-asn1 asn1.js vm-browserify')
exposeToDep('vm-browserify', 'abi-decoder web3 bignumber.js crypto-browserify public-encrypt parse-asn1 asn1.js vm-browserify')
exposeToDep('vm-browserify', 'bignumber.js crypto-browserify public-encrypt parse-asn1 asn1.js vm-browserify')
exposeToDep('c3', 'c3')
exposeToDep('classnames', 'classnames')
exposeToDep('classnames', '@material-ui/core classnames')
exposeToDep('classnames', 'react-select classnames')
exposeToDep('copy-to-clipboard', 'copy-to-clipboard')
exposeToDep('core-js', '@material-ui/core @babel/runtime core-js')
exposeToDep('core-js', 'babel-runtime core-js')
exposeToDep('core-js', 'recompose babel-runtime core-js')
exposeToDep('core-js', '@material-ui/core recompose babel-runtime core-js')
exposeToDep('core-js', 'ethjs ethjs-contract babel-runtime core-js')
exposeToDep('core-js', 'eth-method-registry ethjs ethjs-contract babel-runtime core-js')
exposeToDep('core-js', 'eth-token-tracker ethjs ethjs-contract babel-runtime core-js')
exposeToDep('core-js', 'eth-token-tracker ethjs-contract babel-runtime core-js')
exposeToDep('core-js', 'ethjs-ens ethjs-contract babel-runtime core-js')
exposeToDep('core-js', 'ethjs-contract babel-runtime core-js')
exposeToDep('core-js', 'ethjs ethjs-query babel-runtime core-js')
exposeToDep('core-js', 'eth-method-registry ethjs ethjs-query babel-runtime core-js')
exposeToDep('core-js', 'eth-token-tracker ethjs ethjs-query babel-runtime core-js')
exposeToDep('core-js', 'eth-token-tracker ethjs-query babel-runtime core-js')
exposeToDep('core-js', 'ethjs-ens ethjs-query babel-runtime core-js')
exposeToDep('core-js', 'ethjs-query babel-runtime core-js')
exposeToDep('core-js', 'eth-token-tracker babel-runtime core-js')
exposeToDep('core-js', 'eth-token-tracker eth-block-tracker babel-runtime core-js')
exposeToDep('core-js', '@material-ui/core react-event-listener babel-runtime core-js')
exposeToDep('core-js', 'react-inspector babel-runtime core-js')
exposeToDep('css-vendor', '@material-ui/core jss-vendor-prefixer css-vendor')
exposeToDep('d3-fetch', 'c3 d3 d3-fetch')
exposeToDep('d3-fetch', 'd3 d3-fetch')
exposeToDep('d3-interpolate', 'c3 d3 d3-brush d3-interpolate')
exposeToDep('d3-interpolate', 'd3 d3-brush d3-interpolate')
exposeToDep('d3-interpolate', 'c3 d3 d3-scale-chromatic d3-interpolate')
exposeToDep('d3-interpolate', 'd3 d3-scale-chromatic d3-interpolate')
exposeToDep('d3-interpolate', 'c3 d3 d3-scale d3-interpolate')
exposeToDep('d3-interpolate', 'd3 d3-scale d3-interpolate')
exposeToDep('d3-interpolate', 'c3 d3 d3-brush d3-transition d3-interpolate')
exposeToDep('d3-interpolate', 'd3 d3-brush d3-transition d3-interpolate')
exposeToDep('d3-interpolate', 'c3 d3 d3-zoom d3-transition d3-interpolate')
exposeToDep('d3-interpolate', 'd3 d3-zoom d3-transition d3-interpolate')
exposeToDep('d3-interpolate', 'c3 d3 d3-transition d3-interpolate')
exposeToDep('d3-interpolate', 'd3 d3-transition d3-interpolate')
exposeToDep('d3-interpolate', 'c3 d3 d3-zoom d3-interpolate')
exposeToDep('d3-interpolate', 'd3 d3-zoom d3-interpolate')
exposeToDep('d3-interpolate', 'c3 d3 d3-interpolate')
exposeToDep('d3-interpolate', 'd3 d3-interpolate')
exposeToDep('d3-selection', 'c3 d3 d3-brush d3-selection')
exposeToDep('d3-selection', 'd3 d3-brush d3-selection')
exposeToDep('d3-selection', 'c3 d3 d3-brush d3-drag d3-selection')
exposeToDep('d3-selection', 'd3 d3-brush d3-drag d3-selection')
exposeToDep('d3-selection', 'c3 d3 d3-zoom d3-drag d3-selection')
exposeToDep('d3-selection', 'd3 d3-zoom d3-drag d3-selection')
exposeToDep('d3-selection', 'c3 d3 d3-drag d3-selection')
exposeToDep('d3-selection', 'd3 d3-drag d3-selection')
exposeToDep('d3-selection', 'c3 d3 d3-brush d3-transition d3-selection')
exposeToDep('d3-selection', 'd3 d3-brush d3-transition d3-selection')
exposeToDep('d3-selection', 'c3 d3 d3-zoom d3-transition d3-selection')
exposeToDep('d3-selection', 'd3 d3-zoom d3-transition d3-selection')
exposeToDep('d3-selection', 'c3 d3 d3-transition d3-selection')
exposeToDep('d3-selection', 'd3 d3-transition d3-selection')
exposeToDep('d3-selection', 'c3 d3 d3-zoom d3-selection')
exposeToDep('d3-selection', 'd3 d3-zoom d3-selection')
exposeToDep('d3-selection', 'c3 d3 d3-selection')
exposeToDep('d3-selection', 'd3 d3-selection')
exposeToDep('d3-timer', 'c3 d3 d3-force d3-timer')
exposeToDep('d3-timer', 'd3 d3-force d3-timer')
exposeToDep('d3-timer', 'c3 d3 d3-brush d3-transition d3-timer')
exposeToDep('d3-timer', 'd3 d3-brush d3-transition d3-timer')
exposeToDep('d3-timer', 'c3 d3 d3-zoom d3-transition d3-timer')
exposeToDep('d3-timer', 'd3 d3-zoom d3-transition d3-timer')
exposeToDep('d3-timer', 'c3 d3 d3-transition d3-timer')
exposeToDep('d3-timer', 'd3 d3-transition d3-timer')
exposeToDep('d3-timer', 'c3 d3 d3-timer')
exposeToDep('d3-timer', 'd3 d3-timer')
exposeToDep('d3-zoom', 'c3 d3 d3-zoom')
exposeToDep('d3-zoom', 'd3 d3-zoom')
exposeToDep('detect-node', 'detect-node')
exposeToDep('detectrtc', 'detectrtc')
exposeToDep('dom-helpers', '@material-ui/core dom-helpers')
exposeToDep('dom-helpers', '@material-ui/core react-transition-group dom-helpers')
exposeToDep('dom-helpers', 'react-addons-css-transition-group react-transition-group dom-helpers')
exposeToDep('domkit', 'boron domkit')
exposeToDep('js-sha3', 'ethereumjs-util keccakjs browserify-sha3 js-sha3')
exposeToDep('js-sha3', 'ethereumjs-abi ethereumjs-util keccakjs browserify-sha3 js-sha3')
exposeToDep('js-sha3', 'ethjs ethjs-contract ethjs-abi js-sha3')
exposeToDep('js-sha3', 'eth-method-registry ethjs ethjs-contract ethjs-abi js-sha3')
exposeToDep('js-sha3', 'eth-token-tracker ethjs ethjs-contract ethjs-abi js-sha3')
exposeToDep('js-sha3', 'eth-token-tracker ethjs-contract ethjs-abi js-sha3')
exposeToDep('js-sha3', 'ethjs-ens ethjs-contract ethjs-abi js-sha3')
exposeToDep('js-sha3', 'ethjs-contract ethjs-abi js-sha3')
exposeToDep('js-sha3', 'ethjs ethjs-abi js-sha3')
exposeToDep('js-sha3', 'eth-method-registry ethjs ethjs-abi js-sha3')
exposeToDep('js-sha3', 'eth-token-tracker ethjs ethjs-abi js-sha3')
exposeToDep('js-sha3', 'ethjs ethjs-contract js-sha3')
exposeToDep('js-sha3', 'eth-method-registry ethjs ethjs-contract js-sha3')
exposeToDep('js-sha3', 'eth-token-tracker ethjs ethjs-contract js-sha3')
exposeToDep('js-sha3', 'eth-token-tracker ethjs-contract js-sha3')
exposeToDep('js-sha3', 'ethjs-ens ethjs-contract js-sha3')
exposeToDep('js-sha3', 'ethjs-contract js-sha3')
exposeToDep('js-sha3', 'ethjs js-sha3')
exposeToDep('js-sha3', 'eth-method-registry ethjs js-sha3')
exposeToDep('js-sha3', 'eth-token-tracker ethjs js-sha3')
exposeToDep('js-sha3', 'ethjs-ens eth-ens-namehash js-sha3')
exposeToDep('eth-ens-namehash', 'ethjs-ens eth-ens-namehash')
exposeToDep('readable-stream', 'extension-port-stream readable-stream')
exposeToDep('readable-stream', 'obj-multiplex readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify browserify-sign stream-browserify readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify browserify-cipher browserify-aes cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify browserify-cipher browserify-aes cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign parse-asn1 browserify-aes cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify browserify-sign parse-asn1 browserify-aes cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify public-encrypt parse-asn1 browserify-aes cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify public-encrypt parse-asn1 browserify-aes cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify browserify-cipher browserify-des cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify browserify-cipher browserify-des cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bip39 create-hash cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign create-hash cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify browserify-sign create-hash cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign create-hmac create-hash cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify browserify-sign create-hmac create-hash cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify create-hmac create-hash cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify create-hmac create-hash cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify create-hash cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify create-hash cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'ethereumjs-util create-hash cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'ethereumjs-abi ethereumjs-util create-hash cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bip39 pbkdf2 create-hash cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify pbkdf2 create-hash cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify pbkdf2 create-hash cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign parse-asn1 pbkdf2 create-hash cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify browserify-sign parse-asn1 pbkdf2 create-hash cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify public-encrypt parse-asn1 pbkdf2 create-hash cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify public-encrypt parse-asn1 pbkdf2 create-hash cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify public-encrypt create-hash cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify public-encrypt create-hash cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'ethereumjs-util secp256k1 create-hash cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'ethereumjs-abi ethereumjs-util secp256k1 create-hash cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign create-hmac cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify browserify-sign create-hmac cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify create-hmac cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify create-hmac cipher-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'dnode stream-browserify readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify browserify-cipher browserify-aes evp_bytestokey md5.js hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify browserify-cipher browserify-aes evp_bytestokey md5.js hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign parse-asn1 browserify-aes evp_bytestokey md5.js hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify browserify-sign parse-asn1 browserify-aes evp_bytestokey md5.js hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify public-encrypt parse-asn1 browserify-aes evp_bytestokey md5.js hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify public-encrypt parse-asn1 browserify-aes evp_bytestokey md5.js hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify browserify-cipher evp_bytestokey md5.js hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify browserify-cipher evp_bytestokey md5.js hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign parse-asn1 evp_bytestokey md5.js hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify browserify-sign parse-asn1 evp_bytestokey md5.js hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify public-encrypt parse-asn1 evp_bytestokey md5.js hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify public-encrypt parse-asn1 evp_bytestokey md5.js hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bip39 create-hash ripemd160 hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign create-hash ripemd160 hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify browserify-sign create-hash ripemd160 hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign create-hmac create-hash ripemd160 hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify browserify-sign create-hmac create-hash ripemd160 hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify create-hmac create-hash ripemd160 hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify create-hmac create-hash ripemd160 hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify create-hash ripemd160 hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify create-hash ripemd160 hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'ethereumjs-util create-hash ripemd160 hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'ethereumjs-abi ethereumjs-util create-hash ripemd160 hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bip39 pbkdf2 create-hash ripemd160 hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify pbkdf2 create-hash ripemd160 hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify pbkdf2 create-hash ripemd160 hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign parse-asn1 pbkdf2 create-hash ripemd160 hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify browserify-sign parse-asn1 pbkdf2 create-hash ripemd160 hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify public-encrypt parse-asn1 pbkdf2 create-hash ripemd160 hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify public-encrypt parse-asn1 pbkdf2 create-hash ripemd160 hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify public-encrypt create-hash ripemd160 hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify public-encrypt create-hash ripemd160 hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'ethereumjs-util secp256k1 create-hash ripemd160 hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'ethereumjs-abi ethereumjs-util secp256k1 create-hash ripemd160 hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign create-hmac ripemd160 hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify browserify-sign create-hmac ripemd160 hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify create-hmac ripemd160 hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify create-hmac ripemd160 hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bip39 pbkdf2 ripemd160 hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify pbkdf2 ripemd160 hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify pbkdf2 ripemd160 hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign parse-asn1 pbkdf2 ripemd160 hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify browserify-sign parse-asn1 pbkdf2 ripemd160 hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'abi-decoder web3 bignumber.js crypto-browserify public-encrypt parse-asn1 pbkdf2 ripemd160 hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'bignumber.js crypto-browserify public-encrypt parse-asn1 pbkdf2 ripemd160 hash-base stream-browserify readable-stream')
exposeToDep('readable-stream', 'ethereumjs-util keccak stream-browserify readable-stream')
exposeToDep('readable-stream', 'ethereumjs-abi ethereumjs-util keccak stream-browserify readable-stream')
exposeToDep('readable-stream', 'through2 readable-stream')
exposeToDep('readable-stream', 'web3-stream-provider readable-stream')
exposeToDep('extensionizer', 'extensionizer')
exposeToDep('extensionizer', 'extension-link-enabler extensionizer')
exposeToDep('fbjs', 'recompose fbjs')
exposeToDep('fbjs', '@material-ui/core recompose fbjs')
exposeToDep('fbjs', 'react create-react-class fbjs')
exposeToDep('fbjs', '@material-ui/core react create-react-class fbjs')
exposeToDep('fbjs', 'recompose react create-react-class fbjs')
exposeToDep('fbjs', '@material-ui/core recompose react create-react-class fbjs')
exposeToDep('fbjs', 'boron react create-react-class fbjs')
exposeToDep('fbjs', '@material-ui/core react-transition-group react create-react-class fbjs')
exposeToDep('fbjs', 'react-addons-css-transition-group react-transition-group react create-react-class fbjs')
exposeToDep('fbjs', '@material-ui/core react-dom react create-react-class fbjs')
exposeToDep('fbjs', '@material-ui/core react-transition-group react-dom react create-react-class fbjs')
exposeToDep('fbjs', 'react-addons-css-transition-group react-transition-group react-dom react create-react-class fbjs')
exposeToDep('fbjs', 'react-select react-dom react create-react-class fbjs')
exposeToDep('fbjs', 'react-tippy react-dom react create-react-class fbjs')
exposeToDep('fbjs', 'react-tooltip-component react-dom react create-react-class fbjs')
exposeToDep('fbjs', 'react-dom react create-react-class fbjs')
exposeToDep('fbjs', '@material-ui/core react-event-listener react create-react-class fbjs')
exposeToDep('fbjs', 'sandwich-expando react-hyperscript react create-react-class fbjs')
exposeToDep('fbjs', 'react-hyperscript react create-react-class fbjs')
exposeToDep('fbjs', 'react-select react-input-autosize react create-react-class fbjs')
exposeToDep('fbjs', 'react-inspector react create-react-class fbjs')
exposeToDep('fbjs', 'react-markdown react create-react-class fbjs')
exposeToDep('fbjs', 'react-media react create-react-class fbjs')
exposeToDep('fbjs', 'react-redux react create-react-class fbjs')
exposeToDep('fbjs', 'react-router-dom react create-react-class fbjs')
exposeToDep('fbjs', 'react-router-dom react-router react create-react-class fbjs')
exposeToDep('fbjs', 'react-select react create-react-class fbjs')
exposeToDep('fbjs', 'react-simple-file-input react create-react-class fbjs')
exposeToDep('fbjs', 'react-tippy react create-react-class fbjs')
exposeToDep('fbjs', 'react-toggle-button react create-react-class fbjs')
exposeToDep('fbjs', 'react-tooltip-component react create-react-class fbjs')
exposeToDep('fbjs', 'sandwich-expando react create-react-class fbjs')
exposeToDep('fbjs', 'prop-types fbjs')
exposeToDep('fbjs', '@material-ui/core prop-types fbjs')
exposeToDep('fbjs', '@material-ui/core react-transition-group prop-types fbjs')
exposeToDep('fbjs', 'react-addons-css-transition-group react-transition-group prop-types fbjs')
exposeToDep('fbjs', '@material-ui/core react-dom prop-types fbjs')
exposeToDep('fbjs', '@material-ui/core react-transition-group react-dom prop-types fbjs')
exposeToDep('fbjs', 'react-addons-css-transition-group react-transition-group react-dom prop-types fbjs')
exposeToDep('fbjs', 'react-select react-dom prop-types fbjs')
exposeToDep('fbjs', 'react-tippy react-dom prop-types fbjs')
exposeToDep('fbjs', 'react-tooltip-component react-dom prop-types fbjs')
exposeToDep('fbjs', 'react-dom prop-types fbjs')
exposeToDep('fbjs', '@material-ui/core react-event-listener prop-types fbjs')
exposeToDep('fbjs', 'react-select react-input-autosize prop-types fbjs')
exposeToDep('fbjs', 'react-inspector prop-types fbjs')
exposeToDep('fbjs', '@material-ui/core react-jss prop-types fbjs')
exposeToDep('fbjs', 'react-markdown prop-types fbjs')
exposeToDep('fbjs', 'react-redux prop-types fbjs')
exposeToDep('fbjs', 'react-router-dom prop-types fbjs')
exposeToDep('fbjs', 'react-router-dom react-router prop-types fbjs')
exposeToDep('fbjs', 'react-select prop-types fbjs')
exposeToDep('fbjs', 'react-simple-file-input prop-types fbjs')
exposeToDep('fbjs', 'react prop-types fbjs')
exposeToDep('fbjs', '@material-ui/core react prop-types fbjs')
exposeToDep('fbjs', 'recompose react prop-types fbjs')
exposeToDep('fbjs', '@material-ui/core recompose react prop-types fbjs')
exposeToDep('fbjs', 'boron react prop-types fbjs')
exposeToDep('fbjs', '@material-ui/core react-transition-group react prop-types fbjs')
exposeToDep('fbjs', 'react-addons-css-transition-group react-transition-group react prop-types fbjs')
exposeToDep('fbjs', '@material-ui/core react-dom react prop-types fbjs')
exposeToDep('fbjs', '@material-ui/core react-transition-group react-dom react prop-types fbjs')
exposeToDep('fbjs', 'react-addons-css-transition-group react-transition-group react-dom react prop-types fbjs')
exposeToDep('fbjs', 'react-select react-dom react prop-types fbjs')
exposeToDep('fbjs', 'react-tippy react-dom react prop-types fbjs')
exposeToDep('fbjs', 'react-tooltip-component react-dom react prop-types fbjs')
exposeToDep('fbjs', 'react-dom react prop-types fbjs')
exposeToDep('fbjs', '@material-ui/core react-event-listener react prop-types fbjs')
exposeToDep('fbjs', 'sandwich-expando react-hyperscript react prop-types fbjs')
exposeToDep('fbjs', 'react-hyperscript react prop-types fbjs')
exposeToDep('fbjs', 'react-select react-input-autosize react prop-types fbjs')
exposeToDep('fbjs', 'react-inspector react prop-types fbjs')
exposeToDep('fbjs', 'react-markdown react prop-types fbjs')
exposeToDep('fbjs', 'react-media react prop-types fbjs')
exposeToDep('fbjs', 'react-redux react prop-types fbjs')
exposeToDep('fbjs', 'react-router-dom react prop-types fbjs')
exposeToDep('fbjs', 'react-router-dom react-router react prop-types fbjs')
exposeToDep('fbjs', 'react-select react prop-types fbjs')
exposeToDep('fbjs', 'react-simple-file-input react prop-types fbjs')
exposeToDep('fbjs', 'react-tippy react prop-types fbjs')
exposeToDep('fbjs', 'react-toggle-button react prop-types fbjs')
exposeToDep('fbjs', 'react-tooltip-component react prop-types fbjs')
exposeToDep('fbjs', 'sandwich-expando react prop-types fbjs')
exposeToDep('fbjs', '@material-ui/core react-dom fbjs')
exposeToDep('fbjs', '@material-ui/core react-transition-group react-dom fbjs')
exposeToDep('fbjs', 'react-addons-css-transition-group react-transition-group react-dom fbjs')
exposeToDep('fbjs', 'react-select react-dom fbjs')
exposeToDep('fbjs', 'react-tippy react-dom fbjs')
exposeToDep('fbjs', 'react-tooltip-component react-dom fbjs')
exposeToDep('fbjs', 'react-dom fbjs')
exposeToDep('fbjs', '@material-ui/core react-event-listener fbjs')
exposeToDep('fbjs', 'react fbjs')
exposeToDep('fbjs', '@material-ui/core react fbjs')
exposeToDep('fbjs', 'recompose react fbjs')
exposeToDep('fbjs', '@material-ui/core recompose react fbjs')
exposeToDep('fbjs', 'boron react fbjs')
exposeToDep('fbjs', '@material-ui/core react-transition-group react fbjs')
exposeToDep('fbjs', 'react-addons-css-transition-group react-transition-group react fbjs')
exposeToDep('fbjs', '@material-ui/core react-dom react fbjs')
exposeToDep('fbjs', '@material-ui/core react-transition-group react-dom react fbjs')
exposeToDep('fbjs', 'react-addons-css-transition-group react-transition-group react-dom react fbjs')
exposeToDep('fbjs', 'react-select react-dom react fbjs')
exposeToDep('fbjs', 'react-tippy react-dom react fbjs')
exposeToDep('fbjs', 'react-tooltip-component react-dom react fbjs')
exposeToDep('fbjs', 'react-dom react fbjs')
exposeToDep('fbjs', '@material-ui/core react-event-listener react fbjs')
exposeToDep('fbjs', 'sandwich-expando react-hyperscript react fbjs')
exposeToDep('fbjs', 'react-hyperscript react fbjs')
exposeToDep('fbjs', 'react-select react-input-autosize react fbjs')
exposeToDep('fbjs', 'react-inspector react fbjs')
exposeToDep('fbjs', 'react-markdown react fbjs')
exposeToDep('fbjs', 'react-media react fbjs')
exposeToDep('fbjs', 'react-redux react fbjs')
exposeToDep('fbjs', 'react-router-dom react fbjs')
exposeToDep('fbjs', 'react-router-dom react-router react fbjs')
exposeToDep('fbjs', 'react-select react fbjs')
exposeToDep('fbjs', 'react-simple-file-input react fbjs')
exposeToDep('fbjs', 'react-tippy react fbjs')
exposeToDep('fbjs', 'react-toggle-button react fbjs')
exposeToDep('fbjs', 'react-tooltip-component react fbjs')
exposeToDep('fbjs', 'sandwich-expando react fbjs')
exposeToDep('history', 'react-router-dom history')
exposeToDep('history', 'react-router-dom react-router history')
exposeToDep('inject-css', 'inject-css')
exposeToDep('is-dom', 'react-inspector is-dom')
exposeToDep('is-in-browser', '@material-ui/core jss-vendor-prefixer css-vendor is-in-browser')
exposeToDep('is-in-browser', '@material-ui/core jss is-in-browser')
exposeToDep('is-in-browser', '@material-ui/core jss-global jss is-in-browser')
exposeToDep('jazzicon', 'jazzicon')
exposeToDep('jss', '@material-ui/core jss')
exposeToDep('jss', '@material-ui/core jss-global jss')
exposeToDep('lodash.debounce', 'lodash.debounce')
exposeToDep('lodash.shuffle', 'lodash.shuffle')
exposeToDep('lodash', '@material-ui/core lodash')
exposeToDep('lodash', 'async lodash')
exposeToDep('lodash', 'eth-token-tracker eth-block-tracker async-eventemitter async lodash')
exposeToDep('lodash', 'react-redux lodash')
exposeToDep('lodash', 'react-redux redux lodash')
exposeToDep('lodash', 'redux lodash')
exposeToDep('loglevel', 'loglevel')
exposeToDep('luxon', 'luxon')
exposeToDep('metamask-logo', 'metamask-logo')
exposeToDep('pbkdf2', 'bip39 pbkdf2')
exposeToDep('pbkdf2', 'abi-decoder web3 bignumber.js crypto-browserify pbkdf2')
exposeToDep('pbkdf2', 'bignumber.js crypto-browserify pbkdf2')
exposeToDep('pbkdf2', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign parse-asn1 pbkdf2')
exposeToDep('pbkdf2', 'bignumber.js crypto-browserify browserify-sign parse-asn1 pbkdf2')
exposeToDep('pbkdf2', 'abi-decoder web3 bignumber.js crypto-browserify public-encrypt parse-asn1 pbkdf2')
exposeToDep('pbkdf2', 'bignumber.js crypto-browserify public-encrypt parse-asn1 pbkdf2')
exposeToDep('popper.js', 'react-tippy popper.js')
exposeToDep('punycode', 'ethjs-ens eth-ens-namehash idna-uts46 punycode')
exposeToDep('randombytes', 'bip39 randombytes')
exposeToDep('randombytes', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign browserify-rsa randombytes')
exposeToDep('randombytes', 'bignumber.js crypto-browserify browserify-sign browserify-rsa randombytes')
exposeToDep('randombytes', 'abi-decoder web3 bignumber.js crypto-browserify public-encrypt browserify-rsa randombytes')
exposeToDep('randombytes', 'bignumber.js crypto-browserify public-encrypt browserify-rsa randombytes')
exposeToDep('randombytes', 'abi-decoder web3 bignumber.js crypto-browserify randombytes')
exposeToDep('randombytes', 'bignumber.js crypto-browserify randombytes')
exposeToDep('randombytes', 'abi-decoder web3 bignumber.js crypto-browserify diffie-hellman randombytes')
exposeToDep('randombytes', 'bignumber.js crypto-browserify diffie-hellman randombytes')
exposeToDep('randombytes', 'abi-decoder web3 bignumber.js crypto-browserify public-encrypt randombytes')
exposeToDep('randombytes', 'bignumber.js crypto-browserify public-encrypt randombytes')
exposeToDep('randombytes', 'abi-decoder web3 bignumber.js crypto-browserify randomfill randombytes')
exposeToDep('randombytes', 'bignumber.js crypto-browserify randomfill randombytes')
exposeToDep('randomfill', 'abi-decoder web3 bignumber.js crypto-browserify randomfill')
exposeToDep('randomfill', 'bignumber.js crypto-browserify randomfill')
exposeToDep('raphael', 'jazzicon raphael')
exposeToDep('react-dom', '@material-ui/core react-dom')
exposeToDep('react-dom', '@material-ui/core react-transition-group react-dom')
exposeToDep('react-dom', 'react-addons-css-transition-group react-transition-group react-dom')
exposeToDep('react-dom', 'react-select react-dom')
exposeToDep('react-dom', 'react-tippy react-dom')
exposeToDep('react-dom', 'react-tooltip-component react-dom')
exposeToDep('react-dom', 'react-dom')
exposeToDep('react-event-listener', '@material-ui/core react-event-listener')
exposeToDep('react-input-autosize', 'react-select react-input-autosize')
exposeToDep('react-inspector', 'react-inspector')
exposeToDep('react-media', 'react-media')
exposeToDep('react-select', 'react-select')
exposeToDep('react-simple-file-input', 'react-simple-file-input')
exposeToDep('react-tippy', 'react-tippy')
exposeToDep('react-toggle-button', 'react-toggle-button')
exposeToDep('react-tooltip-component', 'react-tooltip-component')
exposeToDep('redux-logger', 'redux-logger')
exposeToDep('rtcpeerconnection-shim', 'webrtc-adapter rtcpeerconnection-shim')
exposeToDep('symbol-observable', '@material-ui/core jss symbol-observable')
exposeToDep('symbol-observable', '@material-ui/core jss-global jss symbol-observable')
exposeToDep('symbol-observable', 'recompose symbol-observable')
exposeToDep('symbol-observable', '@material-ui/core recompose symbol-observable')
exposeToDep('symbol-observable', 'react-redux redux symbol-observable')
exposeToDep('symbol-observable', 'redux symbol-observable')
exposeToDep('textarea-caret', 'textarea-caret')
exposeToDep('timers-browserify', 'async timers-browserify')
exposeToDep('timers-browserify', 'eth-token-tracker eth-block-tracker async-eventemitter async timers-browserify')
exposeToDep('timers-browserify', 'extension-port-stream readable-stream timers-browserify')
exposeToDep('timers-browserify', 'obj-multiplex readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify browserify-sign stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify browserify-cipher browserify-aes cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify browserify-cipher browserify-aes cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign parse-asn1 browserify-aes cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify browserify-sign parse-asn1 browserify-aes cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify public-encrypt parse-asn1 browserify-aes cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify public-encrypt parse-asn1 browserify-aes cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify browserify-cipher browserify-des cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify browserify-cipher browserify-des cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bip39 create-hash cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign create-hash cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify browserify-sign create-hash cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign create-hmac create-hash cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify browserify-sign create-hmac create-hash cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify create-hmac create-hash cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify create-hmac create-hash cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify create-hash cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify create-hash cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'ethereumjs-util create-hash cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'ethereumjs-abi ethereumjs-util create-hash cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bip39 pbkdf2 create-hash cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify pbkdf2 create-hash cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify pbkdf2 create-hash cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign parse-asn1 pbkdf2 create-hash cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify browserify-sign parse-asn1 pbkdf2 create-hash cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify public-encrypt parse-asn1 pbkdf2 create-hash cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify public-encrypt parse-asn1 pbkdf2 create-hash cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify public-encrypt create-hash cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify public-encrypt create-hash cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'ethereumjs-util secp256k1 create-hash cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'ethereumjs-abi ethereumjs-util secp256k1 create-hash cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign create-hmac cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify browserify-sign create-hmac cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify create-hmac cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify create-hmac cipher-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'dnode stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify browserify-cipher browserify-aes evp_bytestokey md5.js hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify browserify-cipher browserify-aes evp_bytestokey md5.js hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign parse-asn1 browserify-aes evp_bytestokey md5.js hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify browserify-sign parse-asn1 browserify-aes evp_bytestokey md5.js hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify public-encrypt parse-asn1 browserify-aes evp_bytestokey md5.js hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify public-encrypt parse-asn1 browserify-aes evp_bytestokey md5.js hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify browserify-cipher evp_bytestokey md5.js hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify browserify-cipher evp_bytestokey md5.js hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign parse-asn1 evp_bytestokey md5.js hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify browserify-sign parse-asn1 evp_bytestokey md5.js hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify public-encrypt parse-asn1 evp_bytestokey md5.js hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify public-encrypt parse-asn1 evp_bytestokey md5.js hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bip39 create-hash ripemd160 hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign create-hash ripemd160 hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify browserify-sign create-hash ripemd160 hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign create-hmac create-hash ripemd160 hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify browserify-sign create-hmac create-hash ripemd160 hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify create-hmac create-hash ripemd160 hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify create-hmac create-hash ripemd160 hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify create-hash ripemd160 hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify create-hash ripemd160 hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'ethereumjs-util create-hash ripemd160 hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'ethereumjs-abi ethereumjs-util create-hash ripemd160 hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bip39 pbkdf2 create-hash ripemd160 hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify pbkdf2 create-hash ripemd160 hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify pbkdf2 create-hash ripemd160 hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign parse-asn1 pbkdf2 create-hash ripemd160 hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify browserify-sign parse-asn1 pbkdf2 create-hash ripemd160 hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify public-encrypt parse-asn1 pbkdf2 create-hash ripemd160 hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify public-encrypt parse-asn1 pbkdf2 create-hash ripemd160 hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify public-encrypt create-hash ripemd160 hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify public-encrypt create-hash ripemd160 hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'ethereumjs-util secp256k1 create-hash ripemd160 hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'ethereumjs-abi ethereumjs-util secp256k1 create-hash ripemd160 hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign create-hmac ripemd160 hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify browserify-sign create-hmac ripemd160 hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify create-hmac ripemd160 hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify create-hmac ripemd160 hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bip39 pbkdf2 ripemd160 hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify pbkdf2 ripemd160 hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify pbkdf2 ripemd160 hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign parse-asn1 pbkdf2 ripemd160 hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify browserify-sign parse-asn1 pbkdf2 ripemd160 hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'abi-decoder web3 bignumber.js crypto-browserify public-encrypt parse-asn1 pbkdf2 ripemd160 hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'bignumber.js crypto-browserify public-encrypt parse-asn1 pbkdf2 ripemd160 hash-base stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'ethereumjs-util keccak stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'ethereumjs-abi ethereumjs-util keccak stream-browserify readable-stream timers-browserify')
exposeToDep('timers-browserify', 'through2 readable-stream timers-browserify')
exposeToDep('timers-browserify', 'web3-stream-provider readable-stream timers-browserify')
exposeToDep('timers-browserify', 'ethjs ethjs-contract promise-to-callback set-immediate-shim timers-browserify')
exposeToDep('timers-browserify', 'eth-method-registry ethjs ethjs-contract promise-to-callback set-immediate-shim timers-browserify')
exposeToDep('timers-browserify', 'eth-token-tracker ethjs ethjs-contract promise-to-callback set-immediate-shim timers-browserify')
exposeToDep('timers-browserify', 'eth-token-tracker ethjs-contract promise-to-callback set-immediate-shim timers-browserify')
exposeToDep('timers-browserify', 'ethjs-ens ethjs-contract promise-to-callback set-immediate-shim timers-browserify')
exposeToDep('timers-browserify', 'ethjs-contract promise-to-callback set-immediate-shim timers-browserify')
exposeToDep('timers-browserify', 'ethjs ethjs-query promise-to-callback set-immediate-shim timers-browserify')
exposeToDep('timers-browserify', 'eth-method-registry ethjs ethjs-query promise-to-callback set-immediate-shim timers-browserify')
exposeToDep('timers-browserify', 'eth-token-tracker ethjs ethjs-query promise-to-callback set-immediate-shim timers-browserify')
exposeToDep('timers-browserify', 'eth-token-tracker ethjs-query promise-to-callback set-immediate-shim timers-browserify')
exposeToDep('timers-browserify', 'ethjs-ens ethjs-query promise-to-callback set-immediate-shim timers-browserify')
exposeToDep('timers-browserify', 'ethjs-query promise-to-callback set-immediate-shim timers-browserify')
exposeToDep('timers-browserify', 'ethjs ethjs-query ethjs-rpc promise-to-callback set-immediate-shim timers-browserify')
exposeToDep('timers-browserify', 'eth-method-registry ethjs ethjs-query ethjs-rpc promise-to-callback set-immediate-shim timers-browserify')
exposeToDep('timers-browserify', 'eth-token-tracker ethjs ethjs-query ethjs-rpc promise-to-callback set-immediate-shim timers-browserify')
exposeToDep('timers-browserify', 'eth-token-tracker ethjs-query ethjs-rpc promise-to-callback set-immediate-shim timers-browserify')
exposeToDep('timers-browserify', 'ethjs-ens ethjs-query ethjs-rpc promise-to-callback set-immediate-shim timers-browserify')
exposeToDep('timers-browserify', 'ethjs-query ethjs-rpc promise-to-callback set-immediate-shim timers-browserify')
exposeToDep('toggle-selection', 'copy-to-clipboard toggle-selection')
exposeToDep('utf8', 'abi-decoder web3 utf8')
exposeToDep('util-deprecate', 'extension-port-stream readable-stream util-deprecate')
exposeToDep('util-deprecate', 'obj-multiplex readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify browserify-sign stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify browserify-cipher browserify-aes cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify browserify-cipher browserify-aes cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign parse-asn1 browserify-aes cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify browserify-sign parse-asn1 browserify-aes cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify public-encrypt parse-asn1 browserify-aes cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify public-encrypt parse-asn1 browserify-aes cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify browserify-cipher browserify-des cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify browserify-cipher browserify-des cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bip39 create-hash cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign create-hash cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify browserify-sign create-hash cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign create-hmac create-hash cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify browserify-sign create-hmac create-hash cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify create-hmac create-hash cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify create-hmac create-hash cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify create-hash cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify create-hash cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'ethereumjs-util create-hash cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'ethereumjs-abi ethereumjs-util create-hash cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bip39 pbkdf2 create-hash cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify pbkdf2 create-hash cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify pbkdf2 create-hash cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign parse-asn1 pbkdf2 create-hash cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify browserify-sign parse-asn1 pbkdf2 create-hash cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify public-encrypt parse-asn1 pbkdf2 create-hash cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify public-encrypt parse-asn1 pbkdf2 create-hash cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify public-encrypt create-hash cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify public-encrypt create-hash cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'ethereumjs-util secp256k1 create-hash cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'ethereumjs-abi ethereumjs-util secp256k1 create-hash cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign create-hmac cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify browserify-sign create-hmac cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify create-hmac cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify create-hmac cipher-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'dnode stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify browserify-cipher browserify-aes evp_bytestokey md5.js hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify browserify-cipher browserify-aes evp_bytestokey md5.js hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign parse-asn1 browserify-aes evp_bytestokey md5.js hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify browserify-sign parse-asn1 browserify-aes evp_bytestokey md5.js hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify public-encrypt parse-asn1 browserify-aes evp_bytestokey md5.js hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify public-encrypt parse-asn1 browserify-aes evp_bytestokey md5.js hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify browserify-cipher evp_bytestokey md5.js hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify browserify-cipher evp_bytestokey md5.js hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign parse-asn1 evp_bytestokey md5.js hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify browserify-sign parse-asn1 evp_bytestokey md5.js hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify public-encrypt parse-asn1 evp_bytestokey md5.js hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify public-encrypt parse-asn1 evp_bytestokey md5.js hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bip39 create-hash ripemd160 hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign create-hash ripemd160 hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify browserify-sign create-hash ripemd160 hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign create-hmac create-hash ripemd160 hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify browserify-sign create-hmac create-hash ripemd160 hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify create-hmac create-hash ripemd160 hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify create-hmac create-hash ripemd160 hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify create-hash ripemd160 hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify create-hash ripemd160 hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'ethereumjs-util create-hash ripemd160 hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'ethereumjs-abi ethereumjs-util create-hash ripemd160 hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bip39 pbkdf2 create-hash ripemd160 hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify pbkdf2 create-hash ripemd160 hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify pbkdf2 create-hash ripemd160 hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign parse-asn1 pbkdf2 create-hash ripemd160 hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify browserify-sign parse-asn1 pbkdf2 create-hash ripemd160 hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify public-encrypt parse-asn1 pbkdf2 create-hash ripemd160 hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify public-encrypt parse-asn1 pbkdf2 create-hash ripemd160 hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify public-encrypt create-hash ripemd160 hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify public-encrypt create-hash ripemd160 hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'ethereumjs-util secp256k1 create-hash ripemd160 hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'ethereumjs-abi ethereumjs-util secp256k1 create-hash ripemd160 hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign create-hmac ripemd160 hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify browserify-sign create-hmac ripemd160 hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify create-hmac ripemd160 hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify create-hmac ripemd160 hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bip39 pbkdf2 ripemd160 hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify pbkdf2 ripemd160 hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify pbkdf2 ripemd160 hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify browserify-sign parse-asn1 pbkdf2 ripemd160 hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify browserify-sign parse-asn1 pbkdf2 ripemd160 hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'abi-decoder web3 bignumber.js crypto-browserify public-encrypt parse-asn1 pbkdf2 ripemd160 hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'bignumber.js crypto-browserify public-encrypt parse-asn1 pbkdf2 ripemd160 hash-base stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'ethereumjs-util keccak stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'ethereumjs-abi ethereumjs-util keccak stream-browserify readable-stream util-deprecate')
exposeToDep('util-deprecate', 'through2 readable-stream util-deprecate')
exposeToDep('util-deprecate', 'web3-stream-provider readable-stream util-deprecate')
exposeToDep('util', 'assert util')
exposeToDep('util', 'ethereumjs-util assert util')
exposeToDep('util', 'ethereumjs-abi ethereumjs-util assert util')
exposeToDep('util', 'ethereumjs-util rlp assert util')
exposeToDep('util', 'ethereumjs-abi ethereumjs-util rlp assert util')
exposeToDep('util', 'eth-token-tracker eth-block-tracker async-eventemitter util')
exposeToDep('util', 'extension-port-stream util')
exposeToDep('util', 'sandwich-expando util')
exposeToDep('util', 'through2 util')
exposeToDep('util', 'web3-stream-provider util')
exposeToDep('util', 'util')
exposeToDep('webrtc-adapter', 'webrtc-adapter')
exposeToDep('xhr2', 'abi-decoder web3 xhr2')
exposeToDep('xhr2', 'ethjs ethjs-provider-http xhr2')
exposeToDep('xhr2', 'eth-method-registry ethjs ethjs-provider-http xhr2')
exposeToDep('xhr2', 'eth-token-tracker ethjs ethjs-provider-http xhr2')

const config = {
  dependencies: depConfig,
  global: {},
  defaultGlobals,
}
  
//
// start of override
//
  
config.global = {
  // tries to overwrite toString on the prototype, SES dislikes
  "buffer": {
    skipSes: true,
  },
  "bn.js": {
    skipSes: true,
  },
  "unorm": {
    skipSes: true,
  },
  "vfile": {
    skipSes: true,
  },
  "d3-format": {
    skipSes: true,
  },
  "c3": {
    skipSes: true,
  },
  "@zxing/library": {
    skipSes: true,
  },
  // "semver": {
  //   skipSes: true,
  // },
  // "jsonschema": {
  //   skipSes: true,
  // },
  "bignumber.js": {
    skipSes: true,
  },
  "crypto-js": {
    skipSes: true,
  },
  "web3": {
    skipSes: true,
  },
  "js-sha3": {
    skipSes: true,
  },
  // tries to define the toString symbol
  // also fails to grab global
  "core-js": {
    skipSes: true,
  },
  // tries to mutate object.keys
  "deep-equal": {
    skipSes: true,
  },
  // tries to determine the global, cant beat
  "regenerator-runtime": {
    skipSes: true,
  },
  // tries to set the constructor (?)
  "luxon": {
    skipSes: true,
  },
  "d3-color": {
    skipSes: true,
  },
  // "fast-json-patch": {
  //   skipSes: true,
  // },
  // tries to subclass Error
  "vfile-message": {
    skipSes: true,
  },
  // tries to set name on error instance
  "invariant": {
    skipSes: true,
  },
  // tries to modify Error
  "@sentry/core": {
    skipSes: true,
  },
  "@sentry/browser": {
    skipSes: true,
  },
  // // tries to overwrite error.message in error subclass
  // "json-rpc-error": {
  //   skipSes: true,
  // },
  // tries to set an implicit global? "eve"
  "raphael": {
    skipSes: true,
  },
  // tries to override "bind" on method
  "create-react-class": {
    skipSes: true,
  },
  // tries to overwrite Symbol.observable (?)
  "symbol-observable": {
    skipSes: true,
  },
}

return config
  


// // hack to get module to detect dummy global
// function generateEndowmentsForFakeGlobal() {
//   const safeItems = sesEval('({ Object, Symbol })')
//   const endowments = {
//     Object: safeItems.Object,
//     global: {
//       Object: safeItems.Object,
//     }
//   }
//   return endowments
// }

// const extensionizerEndowments = {
//   chrome: typeof chrome !== 'undefined' ? chrome : undefined,
//   browser: typeof browser !== 'undefined' ? browser : undefined,
//   window: typeof window !== 'undefined' ? window : undefined,
// }

// const mathRandomEndowments = {
//   Math: {
//     floor: Math.floor.bind(Math),
//     random: Math.random.bind(Math),
//   }
// }

// const reactRouterHistoryEndowments = {
//   window: {
//     document: {
//       createElement: document.createElement.bind(document),
//     },
//     navigator: {
//       userAgent: window.navigator.userAgent,
//     },
//     location: window.location,
//     history: window.history,
//     addEventListener: window.addEventListener.bind(window),
//   },
// }

// const fakeGlobal = generateEndowmentsForFakeGlobal()

// const config = {
//   dependencies: {
//     "react-dom": {
//       $: {
//         document,
//       },
//     },
//     "react-tippy": {
//       $: {
//         Element,
//       }
//     },
//     "boron domkit": {
//       $: {
//         window: {
//           // for getting vendorPrefix
//           getComputedStyle: window.getComputedStyle.bind(window),
//         },
//         document: {
//           // for feature detection
//           createElement: document.createElement.bind(document),
//           // for getting vendorPrefix
//           documentElement: document.documentElement,
//           // for inserting css into head
//           getElementsByTagName: document.getElementsByTagName.bind(document),
//         },
//       },
//     },
//     // extensionizer provides wrapper for extension globals
//     "extensionizer": {
//       $: extensionizerEndowments,
//     },
//     "react-router-dom history": {
//       $: reactRouterHistoryEndowments,
//     },
//     "react-router-dom react-router history": {
//       $: reactRouterHistoryEndowments,      
//     },
//     // "extension-link-enabler": {
//     //   "extensionizer": {
//     //     $: extensionizerEndowments,
//     //   },
//     // },
//     // // has a wrapper around localStorage (old persistence)
//     // "obs-store": {
//     //   $: {
//     //     global: {
//     //       localStorage,
//     //     },
//     //   },
//     // },
//     // // wants to generate a key from user password
//     // "eth-keyring-controller": {
//     //   "browser-passworder": {
//     //     $: {
//     //       crypto: window.crypto,
//     //     },
//     //   },
//     // },
//     // // wants to talk to infura
//     // "eth-json-rpc-infura": {
//     //   $: {
//     //     fetch: fetch.bind(window),
//     //   },
//     // },
//   },
//   // TODO: permission granting endowments should NOT use global config
//   // global should only be used for hacking in support under SES
//   global: {
//     // inspects screen + protocol
//     "detectrtc": {
//       $: {
//         setInterval: window.setInterval.bind(window),
//         clearInterval: window.clearInterval.bind(window),
//         location: {
//           protocol: window.location.protocol,
//         },
//         screen,
//       },
//     },
//     // needs to create elements and uses document.body as default container
//     "react-tooltip-component": {
//       $: {
//         document: {
//           body: document.body,
//           createElement: document.createElement.bind(document),
//         },
//       },
//     },
//     // checks userAgent for IE/Trident/Edge
//     "react-input-autosize": {
//       $: {
//         window: {
//           navigator: {
//             userAgent: window.navigator.userAgent,
//           },
//         },
//       },
//     },
//     // // feature detection via userAgent
//     // "trezor-connect": {
//     //   $: {
//     //     navigator: {
//     //       userAgent: '',
//     //     },
//     //   },
//     // },
//     // // needs a random starting id
//     // "json-rpc-random-id": {
//     //   $: mathRandomEndowments,
//     // },
//     // "ethjs-rpc": {
//     //   $: mathRandomEndowments,
//     // },
//     // global object detection
//     "async": {
//       $: fakeGlobal,
//     },
//     "lodash.flatmap": {
//       $: fakeGlobal,
//     },
//     "lodash.shuffle": {
//       $: fakeGlobal,
//     },
//     "lodash": {
//       $: fakeGlobal,
//     },
//     "lodash.uniqby": {
//       $: fakeGlobal,
//     },

//     // tries to overwrite toString on the prototype, SES dislikes
//     "buffer": {
//       skipSes: true,
//     },
//     "bn.js": {
//       skipSes: true,
//     },
//     "unorm": {
//       skipSes: true,
//     },
//     "vfile": {
//       skipSes: true,
//     },
//     "d3-format": {
//       skipSes: true,
//     },
//     "c3": {
//       skipSes: true,
//     },
//     "@zxing/library": {
//       skipSes: true,
//     },
//     // "semver": {
//     //   skipSes: true,
//     // },
//     // "jsonschema": {
//     //   skipSes: true,
//     // },
//     "bignumber.js": {
//       skipSes: true,
//     },
//     "crypto-js": {
//       skipSes: true,
//     },
//     "web3": {
//       skipSes: true,
//     },
//     "js-sha3": {
//       skipSes: true,
//     },
//     // tries to define the toString symbol
//     // also fails to grab global
//     "core-js": {
//       skipSes: true,
//     },
//     // tries to mutate object.keys
//     "deep-equal": {
//       skipSes: true,
//     },
//     // tries to determine the global, cant beat
//     "regenerator-runtime": {
//       skipSes: true,
//     },
//     // tries to set the constructor (?)
//     "luxon": {
//       skipSes: true,
//     },
//     "d3-color": {
//       skipSes: true,
//     },
//     // "fast-json-patch": {
//     //   skipSes: true,
//     // },
//     // tries to subclass Error
//     "vfile-message": {
//       skipSes: true,
//     },
//     // tries to set name on error instance
//     "invariant": {
//       skipSes: true,
//     },
//     // tries to modify Error
//     "@sentry/core": {
//       skipSes: true,
//     },
//     "@sentry/browser": {
//       skipSes: true,
//     },
//     // // tries to overwrite error.message in error subclass
//     // "json-rpc-error": {
//     //   skipSes: true,
//     // },
//     // tries to set an implicit global? "eve"
//     "raphael": {
//       skipSes: true,
//     },
//     // tries to override "bind" on method
//     "create-react-class": {
//       skipSes: true,
//     },
//   },
// }

// // these needed setTimeout
//   // "eth-json-rpc-middleware"
//   // "debounce"
//   // "eth-block-tracker"
//   // "safe-event-emitter"
//   // "process"
//   // "_process"

// return config
