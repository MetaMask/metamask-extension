const ObservableStore = require('obs-store')
const normalizeAddress = require('../sig-util').normalize

class PreferencesController {

  constructor (opts = {}) {
    const initState = opts.initState || {}
    this.store = new ObservableStore(initState)
  }

  //
  // PUBLIC METHODS
  //

  setSelectedAddress(_address) {
    const address = normalizeAddress(_address)
    this.store.updateState({ selectedAddress: address })
  }

  getSelectedAddress(_address) {
    return this.store.getState().selectedAddress
  }

  //
  // PRIVATE METHODS
  //

}

module.exports = PreferencesController
