const ObservableStore = require('obs-store')
const normalizeAddress = require('../sig-util').normalize
const extend = require('xtend')

class PreferencesController {

  constructor (opts = {}) {
    const initState = extend({ frequentRpcList: [] }, opts.initState)
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

  addToFrequentRpcList (_url) {
    let rpcList = this.getFrequentRpcList()
    let index = rpcList.findIndex((element) => { return element === _url })
    if (index !== -1) {
      rpcList.splice(index, 1)
    }
    if (_url !== 'http://localhost:8545') {
      rpcList.push(_url)
    }
    if (rpcList.length > 2) {
      rpcList.shift()
    }
    this.store.updateState({ frequentRpcList: rpcList })
    return Promise.resolve()
  }

  getFrequentRpcList () {
    return this.store.getState().frequentRpcList
  }

  //
  // PRIVATE METHODS
  //

}

module.exports = PreferencesController
