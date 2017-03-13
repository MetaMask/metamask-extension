const ObservableStore = require('obs-store')
const extend = require('xtend')

class AddressBookController {


  // Controller in charge of managing the address book functionality from the
  // recipients field on the send screen. Manages a history of all saved
  // addresses and all currently owned addresses.
  constructor (opts = {}, keyringController) {
    const initState = extend({
      addressBook: [],
    }, opts.initState)
    this.store = new ObservableStore(initState)
    this.keyringController = keyringController
  }

  //
  // PUBLIC METHODS
  //

  // Sets a new address book in store by accepting a new address and nickname.
  setAddressBook (address, name) {
    return this._addToAddressBook(address, name)
    .then((addressBook) => {
      this.store.updateState({
        addressBook,
      })
      return Promise.resolve()
    })
  }

  //
  // PRIVATE METHODS
  //


  // Performs the logic to add the address and name into the address book. The
  // pushed object is an object of two fields. Current behavior does not set an
  // upper limit to the number of addresses.
  _addToAddressBook (address, name) {
    let addressBook = this._getAddressBook()
    let identities = this._getIdentities()

    let addressBookIndex = addressBook.findIndex((element) => { return element.address.toLowerCase() === address.toLowerCase() || element.name === name })
    let identitiesIndex = Object.keys(identities).findIndex((element) => { return element.toLowerCase() === address.toLowerCase() })
    // trigger this condition if we own this address--no need to overwrite.
    if (identitiesIndex !== -1) {
      return Promise.resolve(addressBook)
    // trigger this condition if we've seen this address before--may need to update nickname.
    } else if (addressBookIndex !== -1) {
      addressBook.splice(addressBookIndex, 1)
    } else if (addressBook.length > 15) {
      addressBook.shift()
    }


    addressBook.push({
      address: address,
      name,
    })
    return Promise.resolve(addressBook)
  }

  // Internal method to get the address book. Current persistence behavior
  // should not require that this method be called from the UI directly.
  _getAddressBook () {
    return this.store.getState().addressBook
  }

  // Retrieves identities from the keyring controller in order to avoid
  // duplication
  _getIdentities () {
    return this.keyringController.memStore.getState().identities
  }

}

module.exports = AddressBookController
