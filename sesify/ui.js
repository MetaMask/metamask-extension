
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

const reactRouterHistoryEndowments = {
  window: {
    document: {
      createElement: document.createElement.bind(document),
    },
    navigator: {
      userAgent: window.navigator.userAgent,
    },
    location: window.location,
    history: window.history,
    addEventListener: window.addEventListener.bind(window),
  },
}

const fakeGlobal = generateEndowmentsForFakeGlobal()

const config = {
  dependencies: {
    "react-dom": {
      $: {
        document,
      },
    },
    "react-tippy": {
      $: {
        Element,
      }
    },
    "boron domkit": {
      $: {
        window: {
          // for getting vendorPrefix
          getComputedStyle: window.getComputedStyle.bind(window),
        },
        document: {
          // for feature detection
          createElement: document.createElement.bind(document),
          // for getting vendorPrefix
          documentElement: document.documentElement,
          // for inserting css into head
          getElementsByTagName: document.getElementsByTagName.bind(document),
        },
      },
    },
    // extensionizer provides wrapper for extension globals
    "extensionizer": {
      $: extensionizerEndowments,
    },
    "react-router-dom history": {
      $: reactRouterHistoryEndowments,
    },
    "react-router-dom react-router history": {
      $: reactRouterHistoryEndowments,      
    },
    // "extension-link-enabler": {
    //   "extensionizer": {
    //     $: extensionizerEndowments,
    //   },
    // },
    // // has a wrapper around localStorage (old persistence)
    // "obs-store": {
    //   $: {
    //     global: {
    //       localStorage,
    //     },
    //   },
    // },
    // // wants to generate a key from user password
    // "eth-keyring-controller": {
    //   "browser-passworder": {
    //     $: {
    //       crypto: window.crypto,
    //     },
    //   },
    // },
    // // wants to talk to infura
    // "eth-json-rpc-infura": {
    //   $: {
    //     fetch: fetch.bind(window),
    //   },
    // },
  },
  // TODO: permission granting endowments should NOT use global config
  // global should only be used for hacking in support under SES
  global: {
    // inspects screen + protocol
    "detectrtc": {
      $: {
        setInterval: window.setInterval.bind(window),
        clearInterval: window.clearInterval.bind(window),
        location: {
          protocol: window.location.protocol,
        },
        screen,
      },
    },
    // needs to create elements and uses document.body as default container
    "react-tooltip-component": {
      $: {
        document: {
          body: document.body,
          createElement: document.createElement.bind(document),
        },
      },
    },
    // checks userAgent for IE/Trident/Edge
    "react-input-autosize": {
      $: {
        window: {
          navigator: {
            userAgent: window.navigator.userAgent,
          },
        },
      },
    },
    // // feature detection via userAgent
    // "trezor-connect": {
    //   $: {
    //     navigator: {
    //       userAgent: '',
    //     },
    //   },
    // },
    // // needs a random starting id
    // "json-rpc-random-id": {
    //   $: mathRandomEndowments,
    // },
    // "ethjs-rpc": {
    //   $: mathRandomEndowments,
    // },
    // global object detection
    "async": {
      $: fakeGlobal,
    },
    "lodash.flatmap": {
      $: fakeGlobal,
    },
    "lodash.shuffle": {
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
