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
if (!window.crypto) {
  window.crypto = {}
}
if (!window.crypto.getRandomValues) {
  window.crypto.getRandomValues = require('polyfill-crypto.getrandomvalues')
}
