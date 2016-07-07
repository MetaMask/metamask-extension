/* CONTRACT NAMER
 *
 * Takes an address,
 * Returns a nicname if we have one stored,
 * otherwise returns null.
 */

const nicknames = {}

module.exports = function(address) {

  if (address in nicknames) {
    return nicknames[address]
  }

  return null
}
