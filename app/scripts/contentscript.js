const LocalMessageDuplexStream = require('post-message-stream')
const PortStream = require('./lib/port-stream.js')
const ObjectMultiplex = require('./lib/obj-multiplex')
const extension = require('./lib/extension')

const fs = require('fs')
const path = require('path')
const inpageText = fs.readFileSync(path.join(__dirname + '/inpage.js')).toString()

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

function setupInjection(){
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

function setupStreams(){

  // setup communication to page and plugin
  var pageStream = new LocalMessageDuplexStream({
    name: 'contentscript',
    target: 'inpage',
  })
  pageStream.on('error', console.error.bind(console))
  var pluginPort = extension.runtime.connect({name: 'contentscript'})
  var pluginStream = new PortStream(pluginPort)
  pluginStream.on('error', console.error.bind(console))

  // forward communication plugin->inpage
  pageStream.pipe(pluginStream).pipe(pageStream)

  // connect contentscript->inpage reload stream
  var mx = ObjectMultiplex()
  mx.on('error', console.error.bind(console))
  mx.pipe(pageStream)
  var reloadStream = mx.createStream('reload')
  reloadStream.on('error', console.error.bind(console))

  // if we lose connection with the plugin, trigger tab refresh
  pluginStream.on('close', function () {
    reloadStream.write({ method: 'reset' })
  })
}

function shouldInjectWeb3(){
  var shouldInject = (window.location.href.indexOf('.pdf') === -1)
  return shouldInject
}
