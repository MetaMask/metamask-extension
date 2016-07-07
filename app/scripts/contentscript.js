const LocalMessageDuplexStream = require('./lib/local-message-stream.js')
const PortStream = require('./lib/port-stream.js')
const ObjectMultiplex = require('./lib/obj-multiplex')

if (shouldInjectWeb3()) {
  setupInjection()
  setupStreams()
}

function setupInjection(){
  // inject in-page script
  var scriptTag = document.createElement('script')
  scriptTag.src = chrome.extension.getURL('scripts/inpage.js')
  scriptTag.onload = function () { this.parentNode.removeChild(this) }
  var container = document.head || document.documentElement
  // append as first child
  container.insertBefore(scriptTag, container.children[0])
}

function setupStreams(){

  // setup communication to page and plugin
  var pageStream = new LocalMessageDuplexStream({
    name: 'contentscript',
    target: 'inpage',
  })
  pageStream.on('error', console.error.bind(console))
  var pluginPort = chrome.runtime.connect({name: 'contentscript'})
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