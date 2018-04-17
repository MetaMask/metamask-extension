const ObservableStore = require('obs-store')
const extend = require('xtend')
const log = require('loglevel')

// every three seconds when an incomplete tx is waiting
const POLLING_INTERVAL = 3000

class ShapeshiftController {

  constructor (opts = {}) {
    const initState = extend({
      shapeShiftTxList: [],
    }, opts.initState)
    this.store = new ObservableStore(initState)
    this.pollForUpdates()
  }

  //
  // PUBLIC METHODS
  //

  getShapeShiftTxList () {
    const shapeShiftTxList = this.store.getState().shapeShiftTxList
    return shapeShiftTxList
  }

  getPendingTxs () {
    const txs = this.getShapeShiftTxList()
    const pending = txs.filter(tx => tx.response && tx.response.status !== 'complete')
    return pending
  }

  pollForUpdates () {
    const pendingTxs = this.getPendingTxs()

    if (pendingTxs.length === 0) {
      return
    }

    Promise.all(pendingTxs.map((tx) => {
      return this.updateTx(tx)
    }))
    .then((results) => {
      results.forEach(tx => this.saveTx(tx))
      this.timeout = setTimeout(this.pollForUpdates.bind(this), POLLING_INTERVAL)
    })
  }

  async updateTx (tx) {
    try {
      const url = `https://shapeshift.io/txStat/${tx.depositAddress}`
      const response = await fetch(url)
      const json = await response.json()
      tx.response = json
      if (tx.response.status === 'complete') {
        tx.time = new Date().getTime()
      }
      return tx
    } catch (err) {
      log.warn(err)
    }
  }

  saveTx (tx) {
    const { shapeShiftTxList } = this.store.getState()
    const index = shapeShiftTxList.indexOf(tx)
    if (index !== -1) {
      shapeShiftTxList[index] = tx
      this.store.updateState({ shapeShiftTxList })
    }
  }

  removeShapeShiftTx (tx) {
    const { shapeShiftTxList } = this.store.getState()
    const index = shapeShiftTxList.indexOf(index)
    if (index !== -1) {
      shapeShiftTxList.splice(index, 1)
    }
    this.updateState({ shapeShiftTxList })
  }

  createShapeShiftTx (depositAddress, depositType) {
    const state = this.store.getState()
    let { shapeShiftTxList } = state

    var shapeShiftTx = {
      depositAddress,
      depositType,
      key: 'shapeshift',
      time: new Date().getTime(),
      response: {},
    }

    if (!shapeShiftTxList) {
      shapeShiftTxList = [shapeShiftTx]
    } else {
      shapeShiftTxList.push(shapeShiftTx)
    }

    this.store.updateState({ shapeShiftTxList })
    this.pollForUpdates()
  }

}

module.exports = ShapeshiftController
