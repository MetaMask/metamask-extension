const ObservableStore = require('obs-store')
const normalizeAddress = require('eth-sig-util').normalize
const extend = require('xtend')

class PreferencesController {

  constructor (opts = {}) {
    const initState = extend({
      frequentRpcList: [],
      lastAddress: '',
    }, opts.initState)
    this.store = new ObservableStore(initState)
  }

  //
  // PUBLIC METHODS
  //

  setSelectedAddress (_address) {
    return new Promise((resolve, reject) => {
      const address = normalizeAddress(_address)
      this.store.updateState({ selectedAddress: address })
      this.store.updateState({ lastAddress: address })
      resolve()
    })
  }

  restoreLastAddress () {
    return this.setSelectedAddress(this.store.getState().lastAddress)
  }

  clearSelectedAddress () {
    return new Promise((resolve, reject) => {
      this.store.updateState({ selectedAddress: '' })
      resolve()
    })
  }

  getSelectedAddress (_address) {
    return this.store.getState().selectedAddress
  }

  updateFrequentRpcList (_url) {
    return this.addToFrequentRpcList(_url)
      .then((rpcList) => {
        this.store.updateState({ frequentRpcList: rpcList })
        return Promise.resolve()
      })
  }

  addToFrequentRpcList (_url) {
    const rpcList = this.getFrequentRpcList()
    const index = rpcList.findIndex((element) => { return element === _url })
    if (index !== -1) {
      rpcList.splice(index, 1)
    }
    if (_url !== 'http://localhost:8545') {
      rpcList.push(_url)
    }
    if (rpcList.length > 2) {
      rpcList.shift()
    }
    return Promise.resolve(rpcList)
  }

  getFrequentRpcList () {
    return this.store.getState().frequentRpcList
  }
  //
  // PRIVATE METHODS
  //
}

module.exports = PreferencesController
