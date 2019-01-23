
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
exposeToModule('asmcrypto.js', ['crypto', 'location', 'msCrypto', 'performance'])
exposeToModule('brorand', ['crypto', 'msCrypto'])
exposeToModule('browser-passworder', ['crypto'])
exposeToModule('vm-browserify', ['document'])
exposeToModule('core-js', ['document', 'postMessage', 'PromiseRejectionEvent'])
exposeToModule('eth-ens-namehash', ['name'])
exposeToModule('eth-json-rpc-infura', ['fetch'])
exposeToModule('eth-ledger-bridge-keyring', ['document', 'fetch', 'addEventListener'])
exposeToModule('extensionizer', ['browser', 'chrome', 'window'])
exposeToModule('fast-json-patch', ['document', 'addEventListener', 'removeEventListener'])
exposeToModule('fast-levenshtein', ['Intl', 'postMessage'])
exposeToModule('fetch-ponyfill', ['Blob', 'FileReader', 'FormData', 'URLSearchParams'])
exposeToModule('js-sha3', ['navigator'])
exposeToModule('loglevel', ['localStorage', 'document'])
exposeToModule('trezor-connect', ['navigator', 'location', 'chrome', 'document', 'addEventListener', 'removeEventListener', 'open', 'fetch'])
exposeToModule('whatwg-fetch', ['Blob', 'FileReader', 'FormData', 'URLSearchParams', 'XMLHttpRequest'])
exposeToModule('web3', ['XMLHttpRequest'])
exposeToModule('xhr2', ['XMLHttpRequest'])
// set in dep graph
// depGraph goes here
exposeToDep('@sentry/browser', '@sentry/browser')
exposeToDep('asmcrypto.js', 'asmcrypto.js')
exposeToDep('brorand', 'eth-ledger-bridge-keyring hdkey crypto-browserify browserify-sign elliptic brorand')
exposeToDep('brorand', 'eth-trezor-keyring hdkey crypto-browserify browserify-sign elliptic brorand')
exposeToDep('brorand', 'ethereumjs-wallet hdkey crypto-browserify browserify-sign elliptic brorand')
exposeToDep('brorand', 'eth-keyring-controller eth-hd-keyring ethereumjs-wallet hdkey crypto-browserify browserify-sign elliptic brorand')
exposeToDep('brorand', 'eth-keyring-controller eth-simple-keyring ethereumjs-wallet hdkey crypto-browserify browserify-sign elliptic brorand')
exposeToDep('brorand', 'ethereumjs-wallet crypto-browserify browserify-sign elliptic brorand')
exposeToDep('brorand', 'eth-keyring-controller eth-hd-keyring ethereumjs-wallet crypto-browserify browserify-sign elliptic brorand')
exposeToDep('brorand', 'eth-keyring-controller eth-simple-keyring ethereumjs-wallet crypto-browserify browserify-sign elliptic brorand')
exposeToDep('brorand', 'web3 bignumber.js crypto-browserify browserify-sign elliptic brorand')
exposeToDep('brorand', 'eth-ledger-bridge-keyring hdkey crypto-browserify create-ecdh elliptic brorand')
exposeToDep('brorand', 'eth-trezor-keyring hdkey crypto-browserify create-ecdh elliptic brorand')
exposeToDep('brorand', 'ethereumjs-wallet hdkey crypto-browserify create-ecdh elliptic brorand')
exposeToDep('brorand', 'eth-keyring-controller eth-hd-keyring ethereumjs-wallet hdkey crypto-browserify create-ecdh elliptic brorand')
exposeToDep('brorand', 'eth-keyring-controller eth-simple-keyring ethereumjs-wallet hdkey crypto-browserify create-ecdh elliptic brorand')
exposeToDep('brorand', 'ethereumjs-wallet crypto-browserify create-ecdh elliptic brorand')
exposeToDep('brorand', 'eth-keyring-controller eth-hd-keyring ethereumjs-wallet crypto-browserify create-ecdh elliptic brorand')
exposeToDep('brorand', 'eth-keyring-controller eth-simple-keyring ethereumjs-wallet crypto-browserify create-ecdh elliptic brorand')
exposeToDep('brorand', 'web3 bignumber.js crypto-browserify create-ecdh elliptic brorand')
exposeToDep('brorand', 'ethereumjs-util secp256k1 elliptic brorand')
exposeToDep('brorand', 'eth-keyring-controller eth-hd-keyring ethereumjs-util secp256k1 elliptic brorand')
exposeToDep('brorand', 'eth-sig-util ethereumjs-util secp256k1 elliptic brorand')
exposeToDep('brorand', 'eth-keyring-controller eth-hd-keyring eth-sig-util ethereumjs-util secp256k1 elliptic brorand')
exposeToDep('brorand', 'eth-json-rpc-middleware eth-sig-util ethereumjs-util secp256k1 elliptic brorand')
exposeToDep('brorand', 'eth-json-rpc-filters eth-json-rpc-middleware eth-sig-util ethereumjs-util secp256k1 elliptic brorand')
exposeToDep('brorand', 'eth-keyring-controller eth-sig-util ethereumjs-util secp256k1 elliptic brorand')
exposeToDep('brorand', 'eth-ledger-bridge-keyring eth-sig-util ethereumjs-util secp256k1 elliptic brorand')
exposeToDep('brorand', 'eth-keyring-controller eth-simple-keyring eth-sig-util ethereumjs-util secp256k1 elliptic brorand')
exposeToDep('brorand', 'eth-sig-util ethereumjs-abi ethereumjs-util secp256k1 elliptic brorand')
exposeToDep('brorand', 'eth-keyring-controller eth-hd-keyring eth-sig-util ethereumjs-abi ethereumjs-util secp256k1 elliptic brorand')
exposeToDep('brorand', 'eth-json-rpc-middleware eth-sig-util ethereumjs-abi ethereumjs-util secp256k1 elliptic brorand')
exposeToDep('brorand', 'eth-json-rpc-filters eth-json-rpc-middleware eth-sig-util ethereumjs-abi ethereumjs-util secp256k1 elliptic brorand')
exposeToDep('brorand', 'eth-keyring-controller eth-sig-util ethereumjs-abi ethereumjs-util secp256k1 elliptic brorand')
exposeToDep('brorand', 'eth-ledger-bridge-keyring eth-sig-util ethereumjs-abi ethereumjs-util secp256k1 elliptic brorand')
exposeToDep('brorand', 'eth-keyring-controller eth-simple-keyring eth-sig-util ethereumjs-abi ethereumjs-util secp256k1 elliptic brorand')
exposeToDep('brorand', 'eth-keyring-controller ethereumjs-util secp256k1 elliptic brorand')
exposeToDep('brorand', 'eth-ledger-bridge-keyring ethereumjs-util secp256k1 elliptic brorand')
exposeToDep('brorand', 'eth-keyring-controller eth-simple-keyring ethereumjs-util secp256k1 elliptic brorand')
exposeToDep('brorand', 'eth-trezor-keyring ethereumjs-util secp256k1 elliptic brorand')
exposeToDep('brorand', 'ethereumjs-tx ethereumjs-util secp256k1 elliptic brorand')
exposeToDep('brorand', 'eth-trezor-keyring ethereumjs-tx ethereumjs-util secp256k1 elliptic brorand')
exposeToDep('brorand', 'ethereumjs-wallet ethereumjs-util secp256k1 elliptic brorand')
exposeToDep('brorand', 'eth-keyring-controller eth-hd-keyring ethereumjs-wallet ethereumjs-util secp256k1 elliptic brorand')
exposeToDep('brorand', 'eth-keyring-controller eth-simple-keyring ethereumjs-wallet ethereumjs-util secp256k1 elliptic brorand')
exposeToDep('brorand', 'eth-ledger-bridge-keyring hdkey secp256k1 elliptic brorand')
exposeToDep('brorand', 'eth-trezor-keyring hdkey secp256k1 elliptic brorand')
exposeToDep('brorand', 'ethereumjs-wallet hdkey secp256k1 elliptic brorand')
exposeToDep('brorand', 'eth-keyring-controller eth-hd-keyring ethereumjs-wallet hdkey secp256k1 elliptic brorand')
exposeToDep('brorand', 'eth-keyring-controller eth-simple-keyring ethereumjs-wallet hdkey secp256k1 elliptic brorand')
exposeToDep('brorand', 'eth-ledger-bridge-keyring hdkey crypto-browserify diffie-hellman miller-rabin brorand')
exposeToDep('brorand', 'eth-trezor-keyring hdkey crypto-browserify diffie-hellman miller-rabin brorand')
exposeToDep('brorand', 'ethereumjs-wallet hdkey crypto-browserify diffie-hellman miller-rabin brorand')
exposeToDep('brorand', 'eth-keyring-controller eth-hd-keyring ethereumjs-wallet hdkey crypto-browserify diffie-hellman miller-rabin brorand')
exposeToDep('brorand', 'eth-keyring-controller eth-simple-keyring ethereumjs-wallet hdkey crypto-browserify diffie-hellman miller-rabin brorand')
exposeToDep('brorand', 'ethereumjs-wallet crypto-browserify diffie-hellman miller-rabin brorand')
exposeToDep('brorand', 'eth-keyring-controller eth-hd-keyring ethereumjs-wallet crypto-browserify diffie-hellman miller-rabin brorand')
exposeToDep('brorand', 'eth-keyring-controller eth-simple-keyring ethereumjs-wallet crypto-browserify diffie-hellman miller-rabin brorand')
exposeToDep('brorand', 'web3 bignumber.js crypto-browserify diffie-hellman miller-rabin brorand')
exposeToDep('browser-passworder', 'eth-keyring-controller browser-passworder')
exposeToDep('vm-browserify', 'eth-ledger-bridge-keyring hdkey crypto-browserify browserify-sign parse-asn1 asn1.js vm-browserify')
exposeToDep('vm-browserify', 'eth-trezor-keyring hdkey crypto-browserify browserify-sign parse-asn1 asn1.js vm-browserify')
exposeToDep('vm-browserify', 'ethereumjs-wallet hdkey crypto-browserify browserify-sign parse-asn1 asn1.js vm-browserify')
exposeToDep('vm-browserify', 'eth-keyring-controller eth-hd-keyring ethereumjs-wallet hdkey crypto-browserify browserify-sign parse-asn1 asn1.js vm-browserify')
exposeToDep('vm-browserify', 'eth-keyring-controller eth-simple-keyring ethereumjs-wallet hdkey crypto-browserify browserify-sign parse-asn1 asn1.js vm-browserify')
exposeToDep('vm-browserify', 'ethereumjs-wallet crypto-browserify browserify-sign parse-asn1 asn1.js vm-browserify')
exposeToDep('vm-browserify', 'eth-keyring-controller eth-hd-keyring ethereumjs-wallet crypto-browserify browserify-sign parse-asn1 asn1.js vm-browserify')
exposeToDep('vm-browserify', 'eth-keyring-controller eth-simple-keyring ethereumjs-wallet crypto-browserify browserify-sign parse-asn1 asn1.js vm-browserify')
exposeToDep('vm-browserify', 'web3 bignumber.js crypto-browserify browserify-sign parse-asn1 asn1.js vm-browserify')
exposeToDep('vm-browserify', 'eth-ledger-bridge-keyring hdkey crypto-browserify public-encrypt parse-asn1 asn1.js vm-browserify')
exposeToDep('vm-browserify', 'eth-trezor-keyring hdkey crypto-browserify public-encrypt parse-asn1 asn1.js vm-browserify')
exposeToDep('vm-browserify', 'ethereumjs-wallet hdkey crypto-browserify public-encrypt parse-asn1 asn1.js vm-browserify')
exposeToDep('vm-browserify', 'eth-keyring-controller eth-hd-keyring ethereumjs-wallet hdkey crypto-browserify public-encrypt parse-asn1 asn1.js vm-browserify')
exposeToDep('vm-browserify', 'eth-keyring-controller eth-simple-keyring ethereumjs-wallet hdkey crypto-browserify public-encrypt parse-asn1 asn1.js vm-browserify')
exposeToDep('vm-browserify', 'ethereumjs-wallet crypto-browserify public-encrypt parse-asn1 asn1.js vm-browserify')
exposeToDep('vm-browserify', 'eth-keyring-controller eth-hd-keyring ethereumjs-wallet crypto-browserify public-encrypt parse-asn1 asn1.js vm-browserify')
exposeToDep('vm-browserify', 'eth-keyring-controller eth-simple-keyring ethereumjs-wallet crypto-browserify public-encrypt parse-asn1 asn1.js vm-browserify')
exposeToDep('vm-browserify', 'web3 bignumber.js crypto-browserify public-encrypt parse-asn1 asn1.js vm-browserify')
exposeToDep('core-js', 'babel-runtime core-js')
exposeToDep('core-js', 'json-rpc-engine babel-runtime core-js')
exposeToDep('core-js', 'eth-json-rpc-filters json-rpc-engine babel-runtime core-js')
exposeToDep('core-js', 'eth-json-rpc-middleware json-rpc-engine babel-runtime core-js')
exposeToDep('core-js', 'eth-json-rpc-filters eth-json-rpc-middleware json-rpc-engine babel-runtime core-js')
exposeToDep('core-js', 'eth-json-rpc-infura json-rpc-engine babel-runtime core-js')
exposeToDep('core-js', 'obs-store babel-runtime core-js')
exposeToDep('core-js', 'eth-keyring-controller obs-store babel-runtime core-js')
exposeToDep('core-js', 'ethjs-contract babel-runtime core-js')
exposeToDep('core-js', 'eth-trezor-keyring trezor-connect babel-runtime core-js')
exposeToDep('eth-ens-namehash', 'eth-ens-namehash')
exposeToDep('eth-json-rpc-infura', 'eth-json-rpc-infura')
exposeToDep('eth-ledger-bridge-keyring', 'eth-ledger-bridge-keyring')
exposeToDep('extensionizer', 'extensionizer')
exposeToDep('fast-json-patch', 'fast-json-patch')
exposeToDep('fast-levenshtein', 'eth-phishing-detect fast-levenshtein')
exposeToDep('fetch-ponyfill', 'eth-json-rpc-middleware fetch-ponyfill')
exposeToDep('fetch-ponyfill', 'eth-json-rpc-filters eth-json-rpc-middleware fetch-ponyfill')
exposeToDep('js-sha3', 'ethereumjs-util keccakjs browserify-sha3 js-sha3')
exposeToDep('js-sha3', 'eth-keyring-controller eth-hd-keyring ethereumjs-util keccakjs browserify-sha3 js-sha3')
exposeToDep('js-sha3', 'eth-sig-util ethereumjs-util keccakjs browserify-sha3 js-sha3')
exposeToDep('js-sha3', 'eth-keyring-controller eth-hd-keyring eth-sig-util ethereumjs-util keccakjs browserify-sha3 js-sha3')
exposeToDep('js-sha3', 'eth-json-rpc-middleware eth-sig-util ethereumjs-util keccakjs browserify-sha3 js-sha3')
exposeToDep('js-sha3', 'eth-json-rpc-filters eth-json-rpc-middleware eth-sig-util ethereumjs-util keccakjs browserify-sha3 js-sha3')
exposeToDep('js-sha3', 'eth-keyring-controller eth-sig-util ethereumjs-util keccakjs browserify-sha3 js-sha3')
exposeToDep('js-sha3', 'eth-ledger-bridge-keyring eth-sig-util ethereumjs-util keccakjs browserify-sha3 js-sha3')
exposeToDep('js-sha3', 'eth-keyring-controller eth-simple-keyring eth-sig-util ethereumjs-util keccakjs browserify-sha3 js-sha3')
exposeToDep('js-sha3', 'eth-sig-util ethereumjs-abi ethereumjs-util keccakjs browserify-sha3 js-sha3')
exposeToDep('js-sha3', 'eth-keyring-controller eth-hd-keyring eth-sig-util ethereumjs-abi ethereumjs-util keccakjs browserify-sha3 js-sha3')
exposeToDep('js-sha3', 'eth-json-rpc-middleware eth-sig-util ethereumjs-abi ethereumjs-util keccakjs browserify-sha3 js-sha3')
exposeToDep('js-sha3', 'eth-json-rpc-filters eth-json-rpc-middleware eth-sig-util ethereumjs-abi ethereumjs-util keccakjs browserify-sha3 js-sha3')
exposeToDep('js-sha3', 'eth-keyring-controller eth-sig-util ethereumjs-abi ethereumjs-util keccakjs browserify-sha3 js-sha3')
exposeToDep('js-sha3', 'eth-ledger-bridge-keyring eth-sig-util ethereumjs-abi ethereumjs-util keccakjs browserify-sha3 js-sha3')
exposeToDep('js-sha3', 'eth-keyring-controller eth-simple-keyring eth-sig-util ethereumjs-abi ethereumjs-util keccakjs browserify-sha3 js-sha3')
exposeToDep('js-sha3', 'eth-keyring-controller ethereumjs-util keccakjs browserify-sha3 js-sha3')
exposeToDep('js-sha3', 'eth-ledger-bridge-keyring ethereumjs-util keccakjs browserify-sha3 js-sha3')
exposeToDep('js-sha3', 'eth-keyring-controller eth-simple-keyring ethereumjs-util keccakjs browserify-sha3 js-sha3')
exposeToDep('js-sha3', 'eth-trezor-keyring ethereumjs-util keccakjs browserify-sha3 js-sha3')
exposeToDep('js-sha3', 'ethereumjs-tx ethereumjs-util keccakjs browserify-sha3 js-sha3')
exposeToDep('js-sha3', 'eth-trezor-keyring ethereumjs-tx ethereumjs-util keccakjs browserify-sha3 js-sha3')
exposeToDep('js-sha3', 'ethereumjs-wallet ethereumjs-util keccakjs browserify-sha3 js-sha3')
exposeToDep('js-sha3', 'eth-keyring-controller eth-hd-keyring ethereumjs-wallet ethereumjs-util keccakjs browserify-sha3 js-sha3')
exposeToDep('js-sha3', 'eth-keyring-controller eth-simple-keyring ethereumjs-wallet ethereumjs-util keccakjs browserify-sha3 js-sha3')
exposeToDep('js-sha3', 'eth-ens-namehash js-sha3')
exposeToDep('js-sha3', 'ethjs-contract ethjs-abi js-sha3')
exposeToDep('js-sha3', 'ethjs-contract js-sha3')
exposeToDep('loglevel', 'loglevel')
exposeToDep('loglevel', 'eth-keyring-controller loglevel')
exposeToDep('trezor-connect', 'eth-trezor-keyring trezor-connect')
exposeToDep('whatwg-fetch', 'eth-trezor-keyring trezor-connect whatwg-fetch')
exposeToDep('web3', 'web3')
exposeToDep('xhr2', 'web3 xhr2')

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
  "semver": {
    skipSes: true,
  },
  "jsonschema": {
    skipSes: true,
  },
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
  "fast-json-patch": {
    skipSes: true,
  },
  // tries to modify Error
  "@sentry/core": {
    skipSes: true,
  },
  "@sentry/browser": {
    skipSes: true,
  },
  // tries to overwrite error.message in error subclass
  "json-rpc-error": {
    skipSes: true,
  },
}

// autogen failed to parse
;(moduleGlobals['obs-store'] || (moduleGlobals['obs-store'] = {})).localStorage = localStorage

return config


// // // hack to get module to detect dummy global
// // function generateEndowmentsForFakeGlobal() {
// //   const safeItems = sesEval('({ Object, Symbol })')
// //   const endowments = {
// //     Object: safeItems.Object,
// //     global: {
// //       Object: safeItems.Object,
// //     }
// //   }
// //   return endowments
// // }

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

// // const fakeGlobal = generateEndowmentsForFakeGlobal()

// const config = {
//   dependencies: {
//     // extensionizer provides wrapper for extension globals
//     "extensionizer": {
//       $: extensionizerEndowments,
//     },
//     "extension-link-enabler extensionizer": {
//       $: extensionizerEndowments,
//     },
//     // has a wrapper around localStorage (old persistence)
//     "obs-store": {
//       $: {
//         localStorage,
//       },
//     },
//     // wants to generate a key from user password
//     "eth-keyring-controller browser-passworder": {
//       $: {
//         crypto: window.crypto,
//       },
//     },
//     // wants to talk to infura
//     "eth-json-rpc-infura": {
//       $: {
//         fetch: fetch.bind(window),
//       },
//     },
//   },
//   // TODO: permission granting endowments should NOT use global config
//   // global should only be used for hacking in support under SES
//   global: {
//     // feature detection via userAgent
//     "trezor-connect": {
//       $: {
//         navigator: {
//           userAgent: '',
//         },
//       },
//     },
//     // needs a random starting id
//     "json-rpc-random-id": {
//       $: mathRandomEndowments,
//     },
//     "ethjs-rpc": {
//       $: mathRandomEndowments,
//     },
//     // // global object detection
//     // "async": {
//     //   $: fakeGlobal,
//     // },
//     // "lodash.flatmap": {
//     //   $: fakeGlobal,
//     // },
//     // "lodash": {
//     //   $: fakeGlobal,
//     // },
//     // "lodash.uniqby": {
//     //   $: fakeGlobal,
//     // },

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
//     "semver": {
//       skipSes: true,
//     },
//     "jsonschema": {
//       skipSes: true,
//     },
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
//     "fast-json-patch": {
//       skipSes: true,
//     },
//     // tries to modify Error
//     "@sentry/core": {
//       skipSes: true,
//     },
//     "@sentry/browser": {
//       skipSes: true,
//     },
//     // tries to overwrite error.message in error subclass
//     "json-rpc-error": {
//       skipSes: true,
//     },
//   },
// }


// // these are used for global detection by some modules
// const safeObjects = sesEval('({ Object, Symbol })')
// const defaultGlobals = Object.assign({ console, atob, btoa }, safeObjects)

// config.defaultGlobals = defaultGlobals

// // these needed setTimeout
//   // "eth-json-rpc-middleware"
//   // "debounce"
//   // "eth-block-tracker"
//   // "safe-event-emitter"
//   // "process"
//   // "_process"

// return config

