const ObservableStore = require('obs-store')
const normalizeAddress = require('../sig-util').normalize

class PreferencesController {

  constructor (opts = {}) {
    const initState = opts.initState || { frequentRPCList: [] }
    this.store = new ObservableStore(initState)
  }

  //
  // PUBLIC METHODS
  //

  setSelectedAddress (_address) {
    return new Promise((resolve, reject) => {
      const address = normalizeAddress(_address)
      this.store.updateState({ selectedAddress: address })
      resolve()
    })
  }

  getSelectedAddress (_address) {
    return this.store.getState().selectedAddress
  }

  addToFrequentRPCList (_url) {
    return new Promise((resolve, reject) => {
      let rpcList = this.getFrequentRPCList()
      let index = rpcList.findIndex((element) => { element === _url })
      if (index) {
        rpcList.splice(index, 1)
      }
      if (rpcList.length >= 3) {
        rpcList.shift()
      }
      rpcList.push(_url)
      this.store.updateState({ frequentRPCList: rpcList })
      resolve()
    })
  }

  getFrequentRPCList () {
    return this.store.getState().frequentRPCList
  }

  //
  // PRIVATE METHODS
  //

}

module.exports = PreferencesController
