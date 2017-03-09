const ObservableStore = require('obs-store')
const extend = require('xtend')

class AddressBookController {

  constructor (opts = {}) {
    const initState = extend({
      addressBook: [],
    }, opts.initState)
    this.store = new ObservableStore(initState)
  }

  //
  // PUBLIC METHODS
  //

  setAddressBook (address, name) {
    return this.addToAddressBook(address, name)
    .then((addressBook) => {
      this.store.updateState({
        addressBook,
      })
      return Promise.resolve()
    })
  }

  addToAddressBook (address, name) {
    let addressBook = this.getAddressBook()
    let index = addressBook.findIndex((element) => { return element.address === address || element.name === name })
    if (index !== -1) {
      addressBook.splice(index, 1)
    }
    addressBook.push({
      address,
      name,
    })
    return Promise.resolve(addressBook)
  }

  getAddressBook () {
    return this.store.getState().addressBook
  }

}

module.exports = AddressBookController
