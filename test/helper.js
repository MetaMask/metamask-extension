const Ganache = require('ganache-core')
const nock = require('nock')
import Enzyme from 'enzyme'
import Adapter from 'enzyme-adapter-react-15'

nock.disableNetConnect()
nock.enableNetConnect('localhost')

Enzyme.configure({ adapter: new Adapter() })
// disallow promises from swallowing errors
enableFailureOnUnhandledPromiseRejection()

// ganache server
const server = Ganache.server()
server.listen(8545, () => {
  console.log('Ganache Testrpc is running on "http://localhost:8545"')
})

// logging util
var log = require('loglevel')
log.setDefaultLevel(5)
global.log = log

//
// polyfills
//

// fetch
global.fetch = require('isomorphic-fetch')
require('abortcontroller-polyfill/dist/polyfill-patch-fetch')

// dom
require('jsdom-global')()

// localStorage
window.localStorage = {}

// crypto.getRandomValues
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
}
