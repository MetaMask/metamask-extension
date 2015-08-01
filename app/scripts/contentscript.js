const web3 = require('web3')

// inject script tag
var scriptTag = document.createElement('script')
scriptTag.src = chrome.extension.getURL('scripts/web3.js')
scriptTag.onload = function() { debugger; this.parentNode.removeChild(this) }
var container = document.head || document.documentElement
container.appendChild(scriptTag)

// listen for messages
var port = chrome.runtime.connect({name: 'metamask'})
port.postMessage({joke: 'Knock knock'})
port.onMessage.addListener(function(msg) {
	console.log(msg)
    // port.postMessage({answer: 'Madame'})
})