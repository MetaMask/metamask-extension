const ObservableStore = require('obs-store')
const extend = require('xtend')

class AddressBookController {


  // Controller in charge of managing the address book functionality from the
  // recipients field on the send screen. Manages a history of all saved
  // addresses and all currently owned addresses.
  constructor (opts = {}) {
    const initState = extend({
      addressBook: [],
    }, opts.initState)
    this.store = new ObservableStore(initState)
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
    let index = addressBook.findIndex((element) => { return element.address.toLowerCase() === address.toLowerCase() || element.name === name })
    if (index !== -1) {
      addressBook.splice(index, 1)
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

}

module.exports = AddressBookController
