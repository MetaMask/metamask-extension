const ObservableStore = require('obs-store')
const extend = require('xtend')

// every three seconds when an incomplete tx is waiting
const POLLING_INTERVAL = 3000

class ShapeshiftController {

  constructor (opts = {}) {
    const initState = extend({
      shapeShiftTxList: [],
    }, opts)
    this.store = new ObservableStore(initState)
  }

  //
  // PUBLIC METHODS
  //

  getShapeShiftTxList () {
    const shapeShiftTxList = this.store.getState().shapeShiftTxList

    shapeShiftTxList.forEach((tx) => {
      if (tx.response.status === 'no_deposits') {
        this.updateTx(tx)
      }
    })
    console.dir({shapeShiftTxList})
    return shapeShiftTxList
  }

  getPendingTxs () {
    const txs = this.getShapeShiftTxList()
    const pending = txs.filter(tx => tx.response.status !== 'complete')
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
      setTimeout(this.pollForUpdates.bind(this), POLLING_INTERVAL)
    })
  }

  updateTx (tx) {
    const url = `https://shapeshift.io/txStat/${tx.depositAddress}`
    return fetch(url)
    .then((response) => {
      tx.response = response.json()
      if (tx.response.status === 'complete') {
        tx.time = new Date().getTime()
      }
      return tx
    })
  }

  saveTx (tx) {
    const { shapeShiftTxList } = this.store.getState()
    const index = shapeShiftTxList.indexOf(tx)
    if (index !== -1) {
      shapeShiftTxList[index] = tx
      this.store.updateState({ shapeShiftTxList })
    }
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
    console.dir({ shapeShiftTxList })

    this.store.updateState({ shapeShiftTxList })
    this.pollForUpdates()
  }

}

module.exports = ShapeshiftController
