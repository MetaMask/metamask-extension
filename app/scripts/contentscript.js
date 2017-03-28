const LocalMessageDuplexStream = require('post-message-stream')
const PongStream = require('ping-pong-stream/pong')
const PortStream = require('./lib/port-stream.js')
const ObjectMultiplex = require('./lib/obj-multiplex')
const extension = require('./lib/extension')

const fs = require('fs')
const path = require('path')
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
  var pageStream = new LocalMessageDuplexStream({
    name: 'contentscript',
    target: 'inpage',
  })
  pageStream.on('error', console.error)
  var pluginPort = extension.runtime.connect({name: 'contentscript'})
  var pluginStream = new PortStream(pluginPort)
  pluginStream.on('error', console.error)

  // forward communication plugin->inpage
  pageStream.pipe(pluginStream).pipe(pageStream)

  // setup local multistream channels
  var mx = ObjectMultiplex()
  mx.on('error', console.error)
  mx.pipe(pageStream).pipe(mx)

  // connect ping stream
  var pongStream = new PongStream({ objectMode: true })
  pongStream.pipe(mx.createStream('pingpong')).pipe(pongStream)

  // ignore unused channels (handled by background)
  mx.ignoreStream('provider')
  mx.ignoreStream('publicConfig')
  mx.ignoreStream('reload')
}

function shouldInjectWeb3 () {
  return isAllowedSuffix(window.location.href)
}

function isAllowedSuffix (testCase) {
  const doctype = window.document.doctype
  if (doctype) {
    return doctype.name === 'html'
  } else {
    return true
  }
}
