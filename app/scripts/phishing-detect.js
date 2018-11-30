window.onload = function () {
  if (window.location.pathname === '/phishing.html') {
    const {hostname} = parseHash()
    document.getElementById('esdbLink').innerHTML = '<b>To read more about this site and why it was blocked, <a href="https://etherscamdb.info/domain/' + hostname + '"> please navigate here</a>"."</b>'
  }
}

const querystring = require('querystring')
const dnode = require('dnode')
const { EventEmitter } = require('events')
const PortStream = require('extension-port-stream')
const extension = require('extensionizer')
const setupMultiplex = require('./lib/stream-utils.js').setupMultiplex
const { getEnvironmentType } = require('./lib/util')
const ExtensionPlatform = require('./platforms/extension')

document.addEventListener('DOMContentLoaded', start)

function start () {
  const windowType = getEnvironmentType(window.location.href)

  global.platform = new ExtensionPlatform()
  global.METAMASK_UI_TYPE = windowType

  const extensionPort = extension.runtime.connect({ name: windowType })
  const connectionStream = new PortStream(extensionPort)
  const mx = setupMultiplex(connectionStream)
  setupControllerConnection(mx.createStream('controller'), (err, metaMaskController) => {
    if (err) {
      return
    }

    const suspect = parseHash()
    const unsafeContinue = () => {
      window.location.href = suspect.href
    }
    const continueLink = document.getElementById('unsafe-continue')
    continueLink.addEventListener('click', () => {
      metaMaskController.whitelistPhishingDomain(suspect.hostname)
      unsafeContinue()
    })
  })
}

function setupControllerConnection (connectionStream, cb) {
  const eventEmitter = new EventEmitter()
  const accountManagerDnode = dnode({
    sendUpdate (state) {
      eventEmitter.emit('update', state)
    },
  })
  connectionStream.pipe(accountManagerDnode).pipe(connectionStream)
  accountManagerDnode.once('remote', (accountManager) => cb(null, accountManager))
}

function parseHash () {
  const hash = window.location.hash.substring(1)
  return querystring.parse(hash)
}
