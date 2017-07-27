const extension = require('extensionizer')

var port = extension.runtime.connect({name: 'blacklister'})
port.postMessage({ 'pageLoaded': window.location.hostname })
port.onMessage.addListener(redirectIfBlacklisted)

function redirectIfBlacklisted (response) {
  const { blacklist } = response
  const host = window.location.hostname
  if (blacklist && blacklist === host) {
    window.location.href = 'https://metamask.io/phishing.html'
  }
}

