// import Ganache from 'ganache-core'
import Node from '@cfxjs/fullnode'
import nock from 'nock'
import Enzyme from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import log from 'loglevel'

// nock.disableNetConnect()
// nock.enableNetConnect('localhost')

// catch rejections that are still unhandled when tests exit
const unhandledRejections = new Map()
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled rejection:', reason)
  unhandledRejections.set(promise, reason)
})
process.on('rejectionHandled', promise => {
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

const server = new Node({ genBlockInterval: 300, killPortProcess: true })

// unit test global don't need lite
if (
  !process.argv.some(
    arg => typeof arg === 'string' && arg.includes('unit-global')
  )
) {
  // eslint-disable-next-line mocha/no-hooks-for-single-case, mocha/no-top-level-hooks
  before(function(done) {
    server
      .start()
      .then(() => {
        nock.disableNetConnect()
        nock.enableNetConnect('localhost')
        done()
      })
      .catch(err => {
        console.error(err)
      })
  })
}

// ganache server
// const server = Ganache.server()
// server.listen(8545, () => {
//   console.log('Ganache Testrpc is running on "http://localhost:8545"')
// })

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
