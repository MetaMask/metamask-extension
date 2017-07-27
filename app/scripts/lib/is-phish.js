const levenshtein = require('fast-levenshtein')
const blacklistedMetaMaskDomains = ['metamask.com']
let blacklistedDomains = require('etheraddresslookup/blacklists/domains.json').concat(blacklistedMetaMaskDomains)
const whitelistedMetaMaskDomains = ['metamask.io', 'www.metamask.io']
const whitelistedDomains = require('etheraddresslookup/whitelists/domains.json').concat(whitelistedMetaMaskDomains)
const LEVENSHTEIN_TOLERANCE = 4
const LEVENSHTEIN_CHECKS = ['myetherwallet', 'myetheroll', 'ledgerwallet', 'metamask']


// credit to @sogoiii and @409H for their help!
// Return a boolean on whether or not a phish is detected.
function isPhish({ hostname, updatedBlacklist = null }) {
  var strCurrentTab = hostname

  // check if the domain is part of the whitelist.
  if (whitelistedDomains && whitelistedDomains.includes(strCurrentTab)) { return false }

  // Allow updating of blacklist:
  if (updatedBlacklist) {
    blacklistedDomains = blacklistedDomains.concat(updatedBlacklist)
  }

  // check if the domain is part of the blacklist.
  const isBlacklisted = blacklistedDomains && blacklistedDomains.includes(strCurrentTab)

  // check for similar values.
  let levenshteinMatched = false
  var levenshteinForm = strCurrentTab.replace(/\./g, '')
  LEVENSHTEIN_CHECKS.forEach((element) => {
    if (levenshtein.get(element, levenshteinForm) <= LEVENSHTEIN_TOLERANCE) {
      levenshteinMatched = true
    }
  })

  return isBlacklisted || levenshteinMatched
}

module.exports = isPhish
