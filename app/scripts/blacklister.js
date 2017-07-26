const levenshtein = require('fast-levenshtein')
const blacklistedMetaMaskDomains = ['metamask.com']
const blacklistedDomains = require('etheraddresslookup/blacklists/domains.json').concat(blacklistedMetaMaskDomains)
const whitelistedMetaMaskDomains = ['metamask.io', 'www.metamask.io']
const whitelistedDomains = require('etheraddresslookup/whitelists/domains.json').concat(whitelistedMetaMaskDomains)
const LEVENSHTEIN_TOLERANCE = 4
const LEVENSHTEIN_CHECKS = ['myetherwallet', 'myetheroll', 'ledgerwallet', 'metamask']

function isPhish(hostname) {
  var strCurrentTab = hostname

  // check if the domain is part of the whitelist.
  if (whitelistedDomains && whitelistedDomains.includes(strCurrentTab)) { return false }

  // check if the domain is part of the blacklist.
  var isBlacklisted = blacklistedDomains && blacklistedDomains.includes(strCurrentTab)

  // check for similar values.
  var levenshteinMatched = false
  var levenshteinForm = strCurrentTab.replace(/\./g, '')
  LEVENSHTEIN_CHECKS.forEach((element) => {
    if (levenshtein.get(element, levenshteinForm) < LEVENSHTEIN_TOLERANCE) {
      levenshteinMatched = true
    }
  })

  return isBlacklisted || levenshteinMatched
}

window.addEventListener('load', function () {
  var hostnameToCheck = window.location.hostname
  if (isPhish(hostnameToCheck)) {
    window.location.href = 'https://metamask.io/phishing.html'
  }
})

module.exports = isPhish
