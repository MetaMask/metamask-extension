/* CONTRACT NAMER
 *
 * Takes an address,
 * Returns a nicname if we have one stored,
 * otherwise returns null.
 */

// Nickname keys must be stored in lower case.
const contractMap = require('eth-contract-metadata')
const ethUtil = require('ethereumjs-util')

module.exports = function (addr, identities = {}) {
  const checksummed = ethUtil.toChecksumAddress(addr)
  if (contractMap.checksummed && contractMap[checksummed].name) {
    return contractMap[checksummed].name
  }

  const address = addr.toLowerCase()
  const ids = hashFromIdentities(identities)
  return addrFromHash(address, ids)
}

function hashFromIdentities (identities) {
  const result = {}
  for (const key in identities) {
    result[key] = identities[key].name
  }
  return result
}

function addrFromHash (addr, hash) {
  const address = addr.toLowerCase()
  return hash[address] || null
}
