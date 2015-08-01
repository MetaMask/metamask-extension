console.log('\'Allo \'Allo! Content script')

var scriptTag = document.createElement('script')
// TODO: add "script.js" to web_accessible_resources in manifest.json
scriptTag.src = chrome.extension.getURL('scripts/web3.js')

// scriptTag.onload = function() { this.parentNode.removeChild(this) }
;(document.head||document.documentElement).appendChild(scriptTag)