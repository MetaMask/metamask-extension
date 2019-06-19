/* CONTRACT NAMER
 *
 * Takes an address,
 * Returns a nicname if we have one stored,
 * otherwise returns null.
 */

const contractMap = require('eth-contract-metadata')
const { toChecksumAddress } = require('../app/util')

module.exports = function (addr, identities = {}, network) {
  const checksummed = toChecksumAddress(network, addr)
  if (contractMap[checksummed] && contractMap[checksummed].name) {
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
