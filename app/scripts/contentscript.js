const LocalMessageDuplexStream = require('./lib/local-message-stream.js')
const PortStream = require('./lib/port-stream.js')


// inject in-page script
var scriptTag = document.createElement('script')
scriptTag.src = chrome.extension.getURL('scripts/inpage.js')
scriptTag.onload = function() { this.parentNode.removeChild(this) }
var container = document.head || document.documentElement
container.appendChild(scriptTag)

// setup communication to page and plugin
var pageStream = new LocalMessageDuplexStream({
  name: 'contentscript',
  target: 'inpage',
})
var pluginPort = chrome.runtime.connect({name: 'metamask'})
var pluginStream = new PortStream(pluginPort)

// forward communication across
pageStream.pipe(pluginStream)
pluginStream.pipe(pageStream)