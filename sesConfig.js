
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
  // TODO: permission granting endowments should NOT use global config
  // global should only be used for hacking in support under SES
  global: {
    // required to do its job
    "extensionizer": {
      $: {
        chrome: typeof chrome !== 'undefined' ? chrome : undefined,
        browser: typeof browser !== 'undefined' ? browser : undefined,
        window: typeof window !== 'undefined' ? window : undefined,
      }
    },
    // wants localStorage (old code)
    "obs-store": {
      $: {
        global: {
          localStorage,
        },
      },
    },
    // wants to generate a key from user password
    "browser-passworder": {
      $: {
        crypto: window.crypto,
      }
    },
    // wants to talk to infura
    "eth-json-rpc-infura": {
      $: {
        fetch: fetch.bind(window),
      }
    },
    // feature detection via userAgent
    "trezor-connect": {
      $: sesEval(`({
        navigator: {
          userAgent: ''
        }
      })`)
    },
    // needs a random starting id
    "json-rpc-random-id": {
      $: {
        Math: {
          floor: Math.floor.bind(Math),
          random: Math.random.bind(Math),
        }
      }
    },
    "ethjs-rpc": {
      $: {
        Math: {
          floor: Math.floor.bind(Math),
          random: Math.random.bind(Math),
        }
      }
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
    }
  },
  dependencies: {

  }
}

// these needed setTimeout
  // "eth-json-rpc-middleware"
  // "debounce"
  // "eth-block-tracker"
  // "safe-event-emitter"
  // "process"
  // "_process"

return config
