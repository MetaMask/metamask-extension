const messageType = 'metamaskMessage'


// inject in-page script
var scriptTag = document.createElement('script')
scriptTag.src = chrome.extension.getURL('scripts/inpage.js')
scriptTag.onload = function() { this.parentNode.removeChild(this) }
var container = document.head || document.documentElement
container.appendChild(scriptTag)

// listen for messages
var metamaskPlugin = chrome.runtime.connect({name: 'metamask'})
// metamaskPlugin.onMessage.addListener(function(msg) {
//   console.log(msg)
// })

window.addEventListener('message', receiveMessage, false);
function receiveMessage(event){
  var msg = event.data
  // validate message type
  if (typeof msg !== 'object') return
  if (msg.type !== messageType) return
  // forward message
  metamaskPlugin.postMessage(msg)
}