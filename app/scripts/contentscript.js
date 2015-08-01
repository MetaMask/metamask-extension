var scriptTag = document.createElement('script')
scriptTag.src = chrome.extension.getURL('scripts/web3.js')

scriptTag.onload = function() { debugger; this.parentNode.removeChild(this) }
;(document.head||document.documentElement).appendChild(scriptTag)
