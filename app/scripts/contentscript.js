const fs = require('fs')
const path = require('path')
const pump = require('pump')
const LocalMessageDuplexStream = require('post-message-stream')
const PongStream = require('ping-pong-stream/pong')
const ObjectMultiplex = require('obj-multiplex')
const extension = require('extensionizer')
const PortStream = require('./lib/port-stream.js')

const inpageText = fs.readFileSync(path.join(__dirname, 'inpage.js')).toString()

// Eventually this streaming injection could be replaced with:
// https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Language_Bindings/Components.utils.exportFunction
//
// But for now that is only Firefox
// If we create a FireFox-only code path using that API,
// MetaMask will be much faster loading and performant on Firefox.

if (shouldInjectWeb3()) {
  setupInjection()
  setupStreams()
}

function setupInjection () {
  try {
    // inject in-page script
    var scriptTag = document.createElement('script')
    scriptTag.src = extension.extension.getURL('scripts/inpage.js')
    scriptTag.textContent = inpageText
    scriptTag.onload = function () { this.parentNode.removeChild(this) }
    var container = document.head || document.documentElement
    // append as first child
    container.insertBefore(scriptTag, container.children[0])
  } catch (e) {
    console.error('Metamask injection failed.', e)
  }
}

function setupStreams () {
  // setup communication to page and plugin
  const pageStream = new LocalMessageDuplexStream({
    name: 'contentscript',
    target: 'inpage',
  })
  const pluginPort = extension.runtime.connect({ name: 'contentscript' })
  const pluginStream = new PortStream(pluginPort)

  // forward communication plugin->inpage
  pump(
    pageStream,
    pluginStream,
    pageStream,
    (err) => logStreamDisconnectWarning('MetaMask Contentscript Forwarding', err)
  )

  // setup local multistream channels
  const mux = new ObjectMultiplex()
  mux.setMaxListeners(25)

  pump(
    mux,
    pageStream,
    mux,
    (err) => logStreamDisconnectWarning('MetaMask Inpage', err)
  )
  pump(
    mux,
    pluginStream,
    mux,
    (err) => logStreamDisconnectWarning('MetaMask Background', err)
  )

  // connect ping stream
  const pongStream = new PongStream({ objectMode: true })
  pump(
    mux,
    pongStream,
    mux,
    (err) => logStreamDisconnectWarning('MetaMask PingPongStream', err)
  )

  // connect phishing warning stream
  const phishingStream = mux.createStream('phishing')
  phishingStream.once('data', redirectToPhishingWarning)

  // ignore unused channels (handled by background, inpage)
  mux.ignoreStream('provider')
  mux.ignoreStream('publicConfig')
}

function logStreamDisconnectWarning (remoteLabel, err) {
  let warningMsg = `MetamaskContentscript - lost connection to ${remoteLabel}`
  if (err) warningMsg += '\n' + err.stack
  console.warn(warningMsg)
}

function shouldInjectWeb3 () {
  return doctypeCheck() || suffixCheck()
}

function doctypeCheck () {
  const doctype = window.document.doctype
  if (doctype) {
    return doctype.name === 'html'
  } else {
    return false
  }
}

function suffixCheck () {
  var prohibitedTypes = ['xml', 'pdf']
  var currentUrl = window.location.href
  var currentRegex
  for (let i = 0; i < prohibitedTypes.length; i++) {
    currentRegex = new RegExp(`\\.${prohibitedTypes[i]}$`)
    if (currentRegex.test(currentUrl)) {
      return false
    }
  }
  return true
}

function redirectToPhishingWarning () {
  console.log('MetaMask - redirecting to phishing warning')
  window.location.href = 'https://metamask.io/phishing.html'
}
