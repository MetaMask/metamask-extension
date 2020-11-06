import querystring from 'querystring'
import { EventEmitter } from 'events'
import dnode from 'dnode'
import PortStream from 'extension-port-stream'
import extension from 'extensionizer'
import { setupMultiplex } from './lib/stream-utils'
import { getEnvironmentType } from './lib/util'
import ExtensionPlatform from './platforms/extension'

document.addEventListener('DOMContentLoaded', start)

function start() {
  const hash = window.location.hash.substring(1)
  const suspect = querystring.parse(hash)

  document.getElementById('csdbLink').href = `https://cryptoscamdb.org/search`

  global.platform = new ExtensionPlatform()

  const extensionPort = extension.runtime.connect({
    name: getEnvironmentType(),
  })
  const connectionStream = new PortStream(extensionPort)
  const mx = setupMultiplex(connectionStream)
  setupControllerConnection(
    mx.createStream('controller'),
    (err, metaMaskController) => {
      if (err) {
        return
      }

      const continueLink = document.getElementById('unsafe-continue')
      continueLink.addEventListener('click', () => {
        metaMaskController.safelistPhishingDomain(suspect.hostname)
        window.location.href = suspect.href
      })
    },
  )
}

function setupControllerConnection(connectionStream, cb) {
  const eventEmitter = new EventEmitter()
  const metaMaskControllerDnode = dnode({
    sendUpdate(state) {
      eventEmitter.emit('update', state)
    },
  })
  connectionStream.pipe(metaMaskControllerDnode).pipe(connectionStream)
  metaMaskControllerDnode.once('remote', (backgroundConnection) =>
    cb(null, backgroundConnection),
  )
}
