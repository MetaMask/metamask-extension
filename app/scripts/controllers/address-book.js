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

  setAddressList (address, name) {
    return this.addToAddressList(address, name)
    .then((addressBook) => {
      this.store.updateState({
        addressBook,
      })
      return Promise.resolve()
    })
  }

  addToAddressList (address, name) {
    let addressBook = this.getAddressList()
    let index = addressBook.findIndex((element) => { return element.address === address })
    if (index !== -1) {
      addressBook.splice(index, 1)
    }
    addressBook.push({
      address,
      name,
    })
    return Promise.resolve(addressBook)
  }

  getAddressList () {
    return this.store.getState().addressBook
  }

}

module.exports = AddressBookController
