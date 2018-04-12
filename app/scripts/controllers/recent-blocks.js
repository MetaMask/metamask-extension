const ObservableStore = require('obs-store')
const extend = require('xtend')
const BN = require('ethereumjs-util').BN
const EthQuery = require('eth-query')
const log = require('loglevel')

class RecentBlocksController {

  constructor (opts = {}) {
    const { blockTracker, provider } = opts
    this.blockTracker = blockTracker
    this.ethQuery = new EthQuery(provider)
    this.historyLength = opts.historyLength || 40

    const initState = extend({
      recentBlocks: [],
    }, opts.initState)
    this.store = new ObservableStore(initState)

    this.blockTracker.on('block', this.processBlock.bind(this))
    this.backfill()
  }

  resetState () {
    this.store.updateState({
      recentBlocks: [],
    })
  }

  processBlock (newBlock) {
    const block = this.mapTransactionsToPrices(newBlock)

    const state = this.store.getState()
    state.recentBlocks.push(block)

    while (state.recentBlocks.length > this.historyLength) {
      state.recentBlocks.shift()
    }

    this.store.updateState(state)
  }

  backfillBlock (newBlock) {
    const block = this.mapTransactionsToPrices(newBlock)

    const state = this.store.getState()

    if (state.recentBlocks.length < this.historyLength) {
      state.recentBlocks.unshift(block)
    }

    this.store.updateState(state)
  }

  mapTransactionsToPrices (newBlock) {
    const block = extend(newBlock, {
      gasPrices: newBlock.transactions.map((tx) => {
        return tx.gasPrice
      }),
    })
    delete block.transactions
    return block
  }

  async backfill() {
    this.blockTracker.once('block', async (block) => {
      let blockNum = block.number
      let recentBlocks
      let state = this.store.getState()
      recentBlocks = state.recentBlocks

      while (recentBlocks.length < this.historyLength) {
        try {
          let blockNumBn = new BN(blockNum.substr(2), 16)
          const newNum = blockNumBn.subn(1).toString(10)
          const newBlock = await this.getBlockByNumber(newNum)

          if (newBlock) {
            this.backfillBlock(newBlock)
            blockNum = newBlock.number
          }

          state = this.store.getState()
          recentBlocks = state.recentBlocks
        } catch (e) {
          log.error(e)
        }
        await this.wait()
      }
    })
  }

  async wait () {
    return new Promise((resolve) => {
      setTimeout(resolve, 100)
    })
  }

  async getBlockByNumber (number) {
    const bn = new BN(number)
    return new Promise((resolve, reject) => {
      this.ethQuery.getBlockByNumber('0x' + bn.toString(16), true, (err, block) => {
        if (err) reject(err)
        resolve(block)
      })
    })
  }

}

module.exports = RecentBlocksController
