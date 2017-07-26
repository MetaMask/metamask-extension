const extension = require('extensionizer')
console.log('blacklister content script loaded.')

const port = extension.runtime.connect({ name: 'blacklister' })
port.postMessage({ 'pageLoaded': window.location.hostname })
port.onMessage.addListener(redirectIfBlacklisted)

function redirectIfBlacklisted (response) {
  const { blacklist } = response
  console.log('blacklister contentscript received blacklist response')
  const host = window.location.hostname
  if (blacklist && blacklist === host) {
    window.location.href = 'https://metamask.io/phishing.html'
  }
}

