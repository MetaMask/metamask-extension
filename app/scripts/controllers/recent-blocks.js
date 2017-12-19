const ObservableStore = require('obs-store')
const extend = require('xtend')

class RecentBlocksController {

  constructor (opts = {}) {
    const { blockTracker } = opts
    this.blockTracker = blockTracker
    this.historyLength = opts.historyLength || 40

    const initState = extend({
      recentBlocks: [],
    }, opts.initState)
    this.store = new ObservableStore(initState)

    this.blockTracker.on('block', this.processBlock.bind(this))
  }

  resetState () {
    this.store.updateState({
      recentBlocks: [],
    })
  }

  processBlock (newBlock) {
    const block = extend(newBlock, {
      gasPrices: newBlock.transactions.map((tx) => {
        return tx.gasPrice
      }),
    })
    delete block.transactions

    const state = this.store.getState()
    state.recentBlocks.push(block)

    while (state.recentBlocks.length > this.historyLength) {
      state.recentBlocks.shift()
    }

    this.store.updateState(state)
  }
}

module.exports = RecentBlocksController
