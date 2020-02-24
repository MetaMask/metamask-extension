import Ganache from 'ganache-core'
import nock from 'nock'
import Enzyme from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import log from 'loglevel'

nock.disableNetConnect()
nock.enableNetConnect('localhost')

// catch rejections that are still unhandled when tests exit
const unhandledRejections = new Map()
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled rejection:', reason)
  unhandledRejections.set(promise, reason)
})
process.on('rejectionHandled', (promise) => {
  console.log(`handled: ${unhandledRejections.get(promise)}`)
  unhandledRejections.delete(promise)
})

process.on('exit', () => {
  if (unhandledRejections.size > 0) {
    console.error(`Found ${unhandledRejections.size} unhandled rejections:`)
    for (const reason of unhandledRejections.values()) {
      console.error('Unhandled rejection: ', reason)
    }
    process.exit(1)
  }
})

Enzyme.configure({ adapter: new Adapter() })

// ganache server
const server = Ganache.server()
server.listen(8545, () => {})

<<<<<<< HEAD
// logging util
var log = require('loglevel')
=======
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
log.setDefaultLevel(5)
global.log = log

//
// polyfills
//

// fetch
const fetch = require('node-fetch')

global.fetch = fetch
global.Response = fetch.Response
global.Headers = fetch.Headers
global.Request = fetch.Request
require('abortcontroller-polyfill/dist/polyfill-patch-fetch')

// dom
require('jsdom-global')()

// localStorage
window.localStorage = {}

// override metamask-logo
window.requestAnimationFrame = () => {}

// crypto.getRandomValues
<<<<<<< HEAD
if (!window.crypto) window.crypto = {}
if (!window.crypto.getRandomValues) window.crypto.getRandomValues = require('polyfill-crypto.getrandomvalues')

function enableFailureOnUnhandledPromiseRejection () {
  // overwrite node's promise with the stricter Bluebird promise
  global.Promise = require('bluebird')

  // modified from https://github.com/mochajs/mocha/issues/1926#issuecomment-180842722

  // rethrow unhandledRejections
  if (typeof process !== 'undefined') {
    process.on('unhandledRejection', function (reason) {
      throw reason
    })
  } else if (typeof window !== 'undefined') {
    // 2016-02-01: No browsers support this natively, however bluebird, when.js,
    // and probably other libraries do.
    if (typeof window.addEventListener === 'function') {
      window.addEventListener('unhandledrejection', function (evt) {
        throw evt.detail.reason
      })
    } else {
      var oldOHR = window.onunhandledrejection
      window.onunhandledrejection = function (evt) {
        if (typeof oldOHR === 'function') oldOHR.apply(this, arguments)
        throw evt.detail.reason
      }
    }
  } else if (typeof console !== 'undefined' &&
      typeof (console.error || console.log) === 'function') {
    (console.error || console.log)('Unhandled rejections will be ignored!')
  }
=======
if (!window.crypto) {
  window.crypto = {}
}
if (!window.crypto.getRandomValues) {
  window.crypto.getRandomValues = require('polyfill-crypto.getrandomvalues')
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
}
