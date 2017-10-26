const ObservableStore = require('obs-store')
const extend = require('xtend')
const BalanceController = require('./balance')

class RecentGasPricesController {

  constructor (opts = {}) {
    const { blockTracker } = opts
    this.blockTracker = blockTracker
    this.historyLength = opts.historyLength || 40

    // Defaults to 10 gwei for the first price.
    this.defaultPrice = opts.defaultPrice || '0x174876e800'

    // recentGasPrices is an array of arrays.
    // Each array represents a block, and txs that succeeded in it.
    // Inside those block arrays are hex-encoded gasPrice strings.
    // We initialize the history with our default price,
    // to allow client-side faking of a decent gas price.
    const initState = extend({
      recentGasPrices: [[this.defaultPrice]],
    }, opts.initState)
    this.store = new ObservableStore(initState)

    this.blockTracker.on('block', this.processBlock.bind(this))
  }

  resetState () {
    this.store.updateState({
      recentGasPrices: [[this.defaultPrice]],
    })
  }

  processBlock (newBlock) {
    if (newBlock.transactions.length === 0) {
      return
    }

    const gasPrices = newBlock.transactions
    .map(tx => tx.gasPrice)

    const state = this.store.getState()
    state.recentGasPrices.push(gasPrices)

    while (state.recentGasPrices.length > this.historyLength) {
      state.recentGasPrices.shift()
    }

    this.store.updateState(state)
  }

}

module.exports = RecentGasPricesController
