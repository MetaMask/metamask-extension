const allowedMessageTarget = 'metamask'
const allowedMessageType = 'addUnsignedTx'


// inject in-page script
var scriptTag = document.createElement('script')
scriptTag.src = chrome.extension.getURL('scripts/inpage.js')
scriptTag.onload = function() { this.parentNode.removeChild(this) }
var container = document.head || document.documentElement
container.appendChild(scriptTag)

// setup connection with background
var metamaskPlugin = chrome.runtime.connect({name: 'metamask'})

// forward messages from inpage to background
window.addEventListener('message', receiveMessage, false);
function receiveMessage(event){
  var msg = event.data
  // validate message type
  if (typeof msg !== 'object') return
  if (msg.to !== allowedMessageTarget) return
  if (msg.type !== allowedMessageType) return
  // forward message
  metamaskPlugin.postMessage(msg)
}