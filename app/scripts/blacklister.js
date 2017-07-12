const blacklistedDomains = require('etheraddresslookup/blacklists/domains.json')

function detectBlacklistedDomain() {
  var strCurrentTab = window.location.hostname
  if (blacklistedDomains && blacklistedDomains.includes(strCurrentTab)) {
    window.location.href = 'https://metamask.io/phishing.html'
  }
}

window.addEventListener('load', function() {
  detectBlacklistedDomain()
})

