
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

const extensionizerEndowments = {
  chrome: typeof chrome !== 'undefined' ? chrome : undefined,
  browser: typeof browser !== 'undefined' ? browser : undefined,
  window: typeof window !== 'undefined' ? window : undefined,
}

const mathRandomEndowments = {
  Math: {
    floor: Math.floor.bind(Math),
    random: Math.random.bind(Math),
  }
}

const fakeGlobal = generateEndowmentsForFakeGlobal()

const config = {
  dependencies: {
    // extensionizer provides wrapper for extension globals
    "extensionizer": {
      $: extensionizerEndowments,
    },
    "extension-link-enabler": {
      "extensionizer": {
        $: extensionizerEndowments,
      },
    },
    // has a wrapper around localStorage (old persistence)
    "obs-store": {
      $: {
        global: {
          localStorage,
        },
      },
    },
    // wants to generate a key from user password
    "eth-keyring-controller": {
      "browser-passworder": {
        $: {
          crypto: window.crypto,
        },
      },
    },
    // wants to talk to infura
    "eth-json-rpc-infura": {
      $: {
        fetch: fetch.bind(window),
      },
    },
  },
  // TODO: permission granting endowments should NOT use global config
  // global should only be used for hacking in support under SES
  global: {
    // feature detection via userAgent
    "trezor-connect": {
      $: {
        navigator: {
          userAgent: '',
        },
      },
    },
    // needs a random starting id
    "json-rpc-random-id": {
      $: mathRandomEndowments,
    },
    "ethjs-rpc": {
      $: mathRandomEndowments,
    },
    // global object detection
    "async": {
      $: fakeGlobal,
    },
    "lodash.flatmap": {
      $: fakeGlobal,
    },
    "lodash": {
      $: fakeGlobal,
    },
    "lodash.uniqby": {
      $: fakeGlobal,
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
    },
  },
}

// these needed setTimeout
  // "eth-json-rpc-middleware"
  // "debounce"
  // "eth-block-tracker"
  // "safe-event-emitter"
  // "process"
  // "_process"

return config
