
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
exposeToModule('@sentry/browser', ['DOMError', 'DOMException', 'ErrorEvent', 'Headers', 'Request', 'Response', 'XMLHttpRequest', 'document'])
exposeToModule('@zxing/library', ['TextDecoder', 'TextEncoder', 'document', 'navigator'])
exposeToModule('web3', ['XMLHttpRequest'])
exposeToModule('bignumber.js', ['crypto'])
exposeToModule('boron', ['addEventListener', 'removeEventListener'])
exposeToModule('brorand', ['crypto', 'msCrypto'])
exposeToModule('vm-browserify', ['document'])
exposeToModule('c3', ['MutationObserver', 'document', 'addEventListener', 'onresize', 'removeEventListener', 'SVGPathSeg', 'SVGPathSegClosePath', 'SVGPathSegMovetoAbs', 'SVGPathSegMovetoRel', 'SVGPathSegLinetoAbs', 'SVGPathSegLinetoRel', 'SVGPathSegCurvetoCubicAbs', 'SVGPathSegCurvetoCubicRel', 'SVGPathSegCurvetoQuadraticAbs', 'SVGPathSegCurvetoQuadraticRel', 'SVGPathSegArcAbs', 'SVGPathSegArcRel', 'SVGPathSegLinetoHorizontalAbs', 'SVGPathSegLinetoHorizontalRel', 'SVGPathSegLinetoVerticalAbs', 'SVGPathSegLinetoVerticalRel', 'SVGPathSegCurvetoCubicSmoothAbs', 'SVGPathSegCurvetoCubicSmoothRel', 'SVGPathSegCurvetoQuadraticSmoothAbs', 'SVGPathSegCurvetoQuadraticSmoothRel', 'SVGPathElement', 'SVGPathSegList', 'navigator'])
exposeToModule('copy-to-clipboard', ['document', 'navigator', 'prompt'])
exposeToModule('core-js', ['document', 'postMessage', 'PromiseRejectionEvent'])
exposeToModule('css-vendor', ['document', 'getComputedStyle'])
exposeToModule('d3-fetch', ['DOMParser', 'Image', 'fetch'])
exposeToModule('d3-interpolate', ['document'])
exposeToModule('d3-selection', ['document'])
exposeToModule('d3-timer', ['performance', 'requestAnimationFrame'])
exposeToModule('d3-zoom', ['SVGElement'])
exposeToModule('detectrtc', ['MediaStreamTrack', 'RTCIceGatherer', 'WebSocket', 'document', 'location', 'mozRTCPeerConnection', 'screen', 'webkitMediaStream', 'webkitRTCPeerConnection', 'navigator', 'opera', 'InstallTrigger', 'chrome', 'webkitRequestFileSystem', 'indexedDB', 'localStorage', 'RTCPeerConnection', 'window', 'MediaStream'])
exposeToModule('dom-helpers', ['document', 'getComputedStyle', 'window'])
exposeToModule('domkit', ['document', 'getComputedStyle'])
exposeToModule('eth-ens-namehash', ['name'])
exposeToModule('extensionizer', ['browser', 'chrome', 'window'])
exposeToModule('fbjs', ['Worker', 'document', 'addEventListener', 'screen', 'performance', 'msPerformance', 'webkitPerformance'])
exposeToModule('history', ['navigator', 'document', 'confirm', 'history', 'location'])
exposeToModule('inject-css', ['document'])
exposeToModule('is-dom', ['Node'])
exposeToModule('is-in-browser', ['document'])
exposeToModule('jazzicon', ['document'])
exposeToModule('js-sha3', ['navigator'])
exposeToModule('jss', ['document'])
exposeToModule('loglevel', ['localStorage', 'document'])
exposeToModule('luxon', ['Intl'])
exposeToModule('metamask-logo', ['document', 'innerWidth', 'innerHeight', 'addEventListener', 'requestAnimationFrame'])
exposeToModule('popper.js', ['Node', 'cancelAnimationFrame', 'document', 'getComputedStyle', 'navigator', 'requestAnimationFrame', 'innerWidth', 'innerHeight'])
exposeToModule('raphael', ['ActiveXObject', 'DocumentTouch', 'document', 'requestAnimationFrame', 'webkitRequestAnimationFrame', 'mozRequestAnimationFrame', 'oRequestAnimationFrame', 'msRequestAnimationFrame'])
exposeToModule('react-dom', ['document', 'opera', 'navigator', 'top', 'location', 'getSelection', 'performance', 'dispatchEvent', 'MSApp'])
exposeToModule('react-event-listener', ['window', 'addEventListener'])
exposeToModule('react-input-autosize', ['navigator', 'getComputedStyle'])
exposeToModule('react-inspector', ['Node'])
exposeToModule('react-select', ['open', 'location', 'document', 'innerHeight', 'scrollBy'])
exposeToModule('react-simple-file-input', ['File', 'FileReader'])
exposeToModule('react-tippy', ['Element', 'MutationObserver', 'document', 'getComputedStyle', 'navigator', 'performance', 'MSStream', 'requestAnimationFrame', 'addEventListener', 'innerHeight', 'innerWidth'])
exposeToModule('react-toggle-button', ['performance'])
exposeToModule('react-tooltip-component', ['document', 'scrollX', 'pageXOffset', 'scrollY', 'pageYOffset'])
exposeToModule('redux-logger', ['performance'])
exposeToModule('rtcpeerconnection-shim', ['Event', 'document'])
exposeToModule('textarea-caret', ['document', 'getComputedStyle', 'mozInnerScreenX'])
exposeToModule('toggle-selection', ['document'])
exposeToModule('webrtc-adapter', ['DOMException', 'Event', 'RTCSessionDescription', 'navigator'])
exposeToModule('xhr2', ['XMLHttpRequest'])
// set in dep graph
// depGraph goes here
exposeToDep('@sentry/browser', '@sentry/browser')
exposeToDep('@zxing/library', '@zxing/library')
exposeToDep('web3', 'abi-decoder web3')
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
exposeToDep('detectrtc', 'detectrtc')
exposeToDep('dom-helpers', '@material-ui/core dom-helpers')
exposeToDep('dom-helpers', '@material-ui/core react-transition-group dom-helpers')
exposeToDep('dom-helpers', 'react-addons-css-transition-group react-transition-group dom-helpers')
exposeToDep('domkit', 'boron domkit')
exposeToDep('eth-ens-namehash', 'ethjs-ens eth-ens-namehash')
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
exposeToDep('jss', '@material-ui/core jss')
exposeToDep('jss', '@material-ui/core jss-global jss')
exposeToDep('loglevel', 'loglevel')
exposeToDep('luxon', 'luxon')
exposeToDep('metamask-logo', 'metamask-logo')
exposeToDep('popper.js', 'react-tippy popper.js')
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
exposeToDep('react-select', 'react-select')
exposeToDep('react-simple-file-input', 'react-simple-file-input')
exposeToDep('react-tippy', 'react-tippy')
exposeToDep('react-toggle-button', 'react-toggle-button')
exposeToDep('react-tooltip-component', 'react-tooltip-component')
exposeToDep('redux-logger', 'redux-logger')
exposeToDep('rtcpeerconnection-shim', 'webrtc-adapter rtcpeerconnection-shim')
exposeToDep('textarea-caret', 'textarea-caret')
exposeToDep('toggle-selection', 'copy-to-clipboard toggle-selection')
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
