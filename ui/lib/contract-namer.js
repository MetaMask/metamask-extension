/* CONTRACT NAMER
 *
 * Takes an address,
 * Returns a nicname if we have one stored,
 * otherwise returns null.
 */

// Nickname keys must be stored in lower case.
const nicknames = {}

module.exports = function(addr, identities = {}) {

  const address = addr.toLowerCase()
  const ids = hashFromIdentities(identities)

  console.dir({ addr, ids })
  return addrFromHash(address, ids) || addrFromHash(address, nicknames)
}

function hashFromIdentities(identities) {
  const result = {}
  for (let key in identities) {
    result[key] = identities[key].name
  }
  return result
}

function addrFromHash(addr, hash) {
  const address = addr.toLowerCase()
  return hash[address] || null
}
