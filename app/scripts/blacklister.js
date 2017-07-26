const blacklistedDomains = require('etheraddresslookup/blacklists/domains.json')
const levenshtein = require('fast-levenshtein')

function detectBlacklistedDomain() {
  var strCurrentTab = window.location.hostname
  var score = levenshtein.get(strCurrentTab, 'myetherwallet')
  var isBlacklisted = blacklistedDomains && blacklistedDomains.includes(strCurrentTab)

  if (score < 7 || isBlacklisted) {
    window.location.href = 'https://metamask.io/phishing.html'
  }
}

window.addEventListener('load', function() {
  detectBlacklistedDomain()
})
