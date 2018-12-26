
// hack to get module to detect dummy global
function generateEndowmentsForFakeGlobal() {
  const safeItems = sesEval('({ Object, Symbol })')
  const endowments = {
    Object: safeItems.Object,
    global: {
      Object: safeItems.Object,
    }
  }
  return endowments
}

const config = {
  // iframe sharing
  useGlobalRealm: true,
  global: {
    // required to do its job
    "extensionizer": {
      $: {
        chrome: typeof chrome !== 'undefined' && chrome,
        browser: typeof browser !== 'undefined' && browser,
        window: typeof window !== 'undefined' && window,
      }
    },
    "obs-store": {
      $: {
        global: {
          localStorage,
        },
      },
    },
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
    // "@sentry/core" (name parsed incorrectly)
    "@sentry": {
      skipSes: true,
    },
    // global object detection
    "async": {
      $: generateEndowmentsForFakeGlobal(),
    },
    "lodash.flatmap": {
      $: generateEndowmentsForFakeGlobal(),
    },
    "lodash": {
      $: generateEndowmentsForFakeGlobal(),
    },
    "lodash.uniqby": {
      $: generateEndowmentsForFakeGlobal(),
    },
    // feature detection via userAgent
    "trezor-connect": {
      $: sesEval(`({
        navigator: {
          userAgent: ''
        }
      })`)
    },
    // // saving on iframes
    // "stream": {
    //   shareRealmWithChildren: true,
    // },
    // "readable-stream": {
    //   shareRealmWithChildren: true,
    // },
    // "through2": {
    //   shareRealmWithChildren: true,
    // },
    // "eth-json-rpc-filters": {
    //   shareRealmWithChildren: true,
    // },
    // "safe-buffer": {
    //   shareRealmWithChildren: true,
    // },
    // "babel-runtime": {
    //   shareRealmWithChildren: true,
    // },
    // "debounce-stream": {
    //   shareRealmWithChildren: true,
    // },
    // "url": {
    //   shareRealmWithChildren: true,
    // },
    // "end-of-stream": {
    //   shareRealmWithChildren: true,
    // },
    // "pump": {
    //   shareRealmWithChildren: true,
    // },
    // "debounce-stream": {
    //   shareRealmWithChildren: true,
    // },
  },
  dependencies: {

  }
}

// setOnDepConfig({ shareRealmWithChildren: true }, ["eth-keyring-controller","eth-sig-util","ethereumjs-util","keccak","stream"])
// setOnDepConfig({ shareRealmWithChildren: true }, ["eth-keyring-controller","eth-sig-util","ethereumjs-abi"])

function setOnDepConfig (value, depPath) {
  let configPart = config.dependencies
  const lastKey = depPath.slice(-1)[0]
  depPath.slice(0,-1).forEach((pathPart) => {
    // grab next configPart and make sure it exists
    const container = configPart[pathPart] || {}
    configPart[pathPart] = container
    // continue on this new container
    configPart = container
  })
  configPart[lastKey] = value
}

return config
