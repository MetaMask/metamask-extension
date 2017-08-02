const levenshtein = require('fast-levenshtein')
const LEVENSHTEIN_TOLERANCE = 4

// credit to @sogoiii and @409H for their help!
// Return a boolean on whether or not a phish is detected.
function isPhish({ hostname, blacklist, whitelist, fuzzylist }) {

  // check if the domain is part of the whitelist.
  if (whitelist && whitelist.includes(hostname)) return false

  // check if the domain is part of the blacklist.
  if (blacklist && blacklist.includes(hostname)) return true

  // check for similar values.
  const levenshteinForm = hostname.replace(/\./g, '')
  const levenshteinMatched = fuzzylist.some((element) => {
    return levenshtein.get(element, levenshteinForm) <= LEVENSHTEIN_TOLERANCE
  })

  return levenshteinMatched
}

module.exports = isPhish
