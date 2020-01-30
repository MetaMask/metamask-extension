const querystring = require('querystring')
const dnode = require('dnode')
const { EventEmitter } = require('events')
const PortStream = require('extension-port-stream')
const extension = require('extensionizer')
const {setupMultiplex} = require('./lib/stream-utils.js')
const { getEnvironmentType } = require('./lib/util')
const ExtensionPlatform = require('./platforms/extension')

document.addEventListener('DOMContentLoaded', start)

function start () {
  const windowType = getEnvironmentType(window.location.href)
  const hash = window.location.hash.substring(1)
  const suspect = querystring.parse(hash)

  document.getElementById('esdbLink').href = `https://etherscamdb.info/domain/${suspect.hostname}`

  global.platform = new ExtensionPlatform()
  global.METAMASK_UI_TYPE = windowType

  const extensionPort = extension.runtime.connect({ name: windowType })
  const connectionStream = new PortStream(extensionPort)
  const mx = setupMultiplex(connectionStream)
  setupControllerConnection(mx.createStream('controller'), (err, metaMaskController) => {
    if (err) {
      return
    }

    const continueLink = document.getElementById('unsafe-continue')
    continueLink.addEventListener('click', () => {
      metaMaskController.whitelistPhishingDomain(suspect.hostname)
      window.location.href = suspect.href
    })
  })
}

function setupControllerConnection (connectionStream, cb) {
  const eventEmitter = new EventEmitter()
  const metaMaskControllerDnode = dnode({
    sendUpdate (state) {
      eventEmitter.emit('update', state)
    },
  })
  connectionStream.pipe(metaMaskControllerDnode).pipe(connectionStream)
  metaMaskControllerDnode.once('remote', (backgroundConnection) => cb(null, backgroundConnection))
}
