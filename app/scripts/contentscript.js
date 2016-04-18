const LocalMessageDuplexStream = require('./lib/local-message-stream.js')
const PortStream = require('./lib/port-stream.js')


// inject in-page script
var scriptTag = document.createElement('script')
scriptTag.src = chrome.extension.getURL('scripts/inpage.js')
scriptTag.onload = function() { this.parentNode.removeChild(this) }
var container = document.head || document.documentElement
// append as first child
container.insertBefore(scriptTag, container.children[0])

// setup communication to page and plugin
var pageStream = new LocalMessageDuplexStream({
  name: 'contentscript',
  target: 'inpage',
})
var pluginPort = chrome.runtime.connect({name: 'contentscript'})
var pluginStream = new PortStream(pluginPort)

// forward communication across
pageStream.pipe(pluginStream)
pluginStream.pipe(pageStream)

// log errors
pageStream.on('error', console.error.bind(console))
pluginStream.on('error', console.error.bind(console))