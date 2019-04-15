const ObservableStore = require('obs-store')
const extend = require('xtend')
const EthQuery = require('eth-query')
const log = require('loglevel')
const pify = require('pify')
const {
  ROPSTEN,
  RINKEBY,
  KOVAN,
  MAINNET,
  GOERLI,
} = require('./network/enums')
const INFURA_PROVIDER_TYPES = [ROPSTEN, RINKEBY, KOVAN, MAINNET, GOERLI]


class RecentBlocksController {

  /**
   * Controller responsible for storing, updating and managing the recent history of blocks. Blocks are back filled
   * upon the controller's construction and then the list is updated when the given block tracker gets a 'latest' event
   * (indicating that there is a new block to process).
   *
   * @typedef {Object} RecentBlocksController
   * @param {object} opts Contains objects necessary for tracking blocks and querying the blockchain
   * @param {BlockTracker} opts.blockTracker Contains objects necessary for tracking blocks and querying the blockchain
   * @param {BlockTracker} opts.provider The provider used to create a new EthQuery instance.
   * @property {BlockTracker} blockTracker Points to the passed BlockTracker. On RecentBlocksController construction,
   * listens for 'latest' events so that new blocks can be processed and added to storage.
   * @property {EthQuery} ethQuery Points to the EthQuery instance created with the passed provider
   * @property {number} historyLength The maximum length of blocks to track
   * @property {object} store Stores the recentBlocks
   * @property {array} store.recentBlocks Contains all recent blocks, up to a total that is equal to this.historyLength
   *
   */
  constructor (opts = {}) {
    const { blockTracker, provider, networkController } = opts
    this.blockTracker = blockTracker
    this.ethQuery = new EthQuery(provider)
    this.historyLength = opts.historyLength || 40

    const initState = extend({
      recentBlocks: [],
    }, opts.initState)
    this.store = new ObservableStore(initState)
    const blockListner = async (newBlockNumberHex) => {
      try {
        await this.processBlock(newBlockNumberHex)
      } catch (err) {
        log.error(err)
      }
    }
    let isListening = false
    const { type } = networkController.getProviderConfig()
    if (!INFURA_PROVIDER_TYPES.includes(type) && type !== 'loading') {
      this.blockTracker.on('latest', blockListner)
      isListening = true
    }
    networkController.on('networkDidChange', (newType) => {
      if (INFURA_PROVIDER_TYPES.includes(newType) && isListening) {
        this.blockTracker.removeListener('latest', blockListner)
      } else if (
        !INFURA_PROVIDER_TYPES.includes(type) &&
        type !== 'loading' &&
        !isListening
      ) {
        this.blockTracker.on('latest', blockListner)

      }
    })
    this.backfill()
  }

  /**
   * Sets store.recentBlocks to an empty array
   *
   */
  resetState () {
    this.store.updateState({
      recentBlocks: [],
    })
  }

  /**
   * Receives a new block and modifies it with this.mapTransactionsToPrices. Then adds that block to the recentBlocks
   * array in storage. If the recentBlocks array contains the maximum number of blocks, the oldest block is removed.
   *
   * @param {object} newBlock The new block to modify and add to the recentBlocks array
   *
   */
  async processBlock (newBlockNumberHex) {
    const newBlockNumber = Number.parseInt(newBlockNumberHex, 16)
    const newBlock = await this.getBlockByNumber(newBlockNumber, true)
    if (!newBlock) return

    const block = this.mapTransactionsToPrices(newBlock)

    const state = this.store.getState()
    state.recentBlocks.push(block)

    while (state.recentBlocks.length > this.historyLength) {
      state.recentBlocks.shift()
    }

    this.store.updateState(state)
  }

  /**
   * Receives a new block and modifies it with this.mapTransactionsToPrices. Adds that block to the recentBlocks
   * array in storage, but only if the recentBlocks array contains fewer than the maximum permitted.
   *
   * Unlike this.processBlock, backfillBlock adds the modified new block to the beginning of the recent block array.
   *
   * @param {object} newBlock The new block to modify and add to the beginning of the recentBlocks array
   *
   */
  backfillBlock (newBlock) {
    const block = this.mapTransactionsToPrices(newBlock)

    const state = this.store.getState()

    if (state.recentBlocks.length < this.historyLength) {
      state.recentBlocks.unshift(block)
    }

    this.store.updateState(state)
  }

  /**
   * Receives a block and gets the gasPrice of each of its transactions. These gas prices are added to the block at a
   * new property, and the block's transactions are removed.
   *
   * @param {object} newBlock The block to modify. It's transaction array will be replaced by a gasPrices array.
   * @returns {object} The modified block.
   *
   */
  mapTransactionsToPrices (newBlock) {
    const block = extend(newBlock, {
      gasPrices: newBlock.transactions.map((tx) => {
        return tx.gasPrice
      }),
    })
    delete block.transactions
    return block
  }

  /**
   * On this.blockTracker's first 'latest' event after this RecentBlocksController's instantiation, the store.recentBlocks
   * array is populated with this.historyLength number of blocks. The block number of the this.blockTracker's first
   * 'latest' event is used to iteratively generate all the numbers of the previous blocks, which are obtained by querying
   * the blockchain. These blocks are backfilled so that the recentBlocks array is ordered from oldest to newest.
   *
   * Each iteration over the block numbers is delayed by 100 milliseconds.
   *
   * @returns {Promise<void>} Promises undefined
   */
  async backfill () {
    this.blockTracker.once('latest', async (blockNumberHex) => {
      const currentBlockNumber = Number.parseInt(blockNumberHex, 16)
      const blocksToFetch = Math.min(currentBlockNumber, this.historyLength)
      const prevBlockNumber = currentBlockNumber - 1
      const targetBlockNumbers = Array(blocksToFetch).fill().map((_, index) => prevBlockNumber - index)
      await Promise.all(targetBlockNumbers.map(async (targetBlockNumber) => {
        try {
          const newBlock = await this.getBlockByNumber(targetBlockNumber, true)
          if (!newBlock) return

          this.backfillBlock(newBlock)
        } catch (e) {
          log.error(e)
        }
      }))
    })
  }

  /**
   * Uses EthQuery to get a block that has a given block number.
   *
   * @param {number} number The number of the block to get
   * @returns {Promise<object>} Promises A block with the passed number
   *
   */
  async getBlockByNumber (number) {
    const blockNumberHex = '0x' + number.toString(16)
    return await pify(this.ethQuery.getBlockByNumber).call(this.ethQuery, blockNumberHex, true)
  }

}

module.exports = RecentBlocksController
