const version = 37
const clone = require('clone')
const {
  util,
} = require('gaba')

/**
 * The purpose of this migration is to update the address book state
 * to the new schema with chainId as a key.
 * and to add the isEns flag to all entries
 */
module.exports = {
  version,
  migrate: async function (originalVersionedData) {
    const versionedData = clone(originalVersionedData)
    versionedData.meta.version = version
    const state = versionedData.data
    versionedData.data = transformState(state)
    return versionedData
  },
}

function transformState (state) {

  if (state.AddressBookController) {
    const ab = state.AddressBookController.addressBook

    const chainIds = new Set()
    const newAddressBook = {}

    // add all of the chainIds to a set
    for (const item in ab) {
      chainIds.add(ab[item].chainId)
    }

    // fill the chainId object with the entries with the matching chainId
    for (const id of chainIds.values()) {
    // make an empty object entry for each chainId
      newAddressBook[id] = {}
      for (const address in ab) {
        if (ab[address].chainId === id) {

          ab[address].isEns = false
          if (util.normalizeEnsName(ab[address].name)) {
            ab[address].isEns = true
          }
          newAddressBook[id][address] = ab[address]
        }
      }
    }

    state.AddressBookController.addressBook = newAddressBook
  }

  return state
}
