const ObservableStore = require('obs-store')
const extend = require('xtend')
const EthQuery = require('eth-query')
const log = require('loglevel')
const pify = require('pify')
const BN = require('ethereumjs-util').BN
const percentile = require('percentile')

const GWEI_BN = new BN('1000000000')

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
    const { blockTracker, provider } = opts
    this.blockTracker = blockTracker
    this.ethQuery = new EthQuery(provider)
    this.historyLength = opts.historyLength || 40
    this.store = new ObservableStore()
  }

  /**
   * A method for estimating a good gas price at recent prices.
   * Returns the lowest price that would have been included in
   * 50% of recent blocks.
   *
   * @returns {string} A hex representation of the suggested wei gas price.
   */
  async getGasPrice () {
    const recentBlocks = await this.queryRecentBlocks()

    // Return 1 gwei if no blocks have been observed:
    if (recentBlocks.length === 0) {
      return '0x' + GWEI_BN.toString(16)
    }

    const lowestPrices = recentBlocks.map((block) => {
      if (!block.gasPrices || block.gasPrices.length < 1) {
        return GWEI_BN
      }
      return block.gasPrices
      .map(hexPrefix => hexPrefix.substr(2))
      .map(hex => new BN(hex, 16))
      .sort((a, b) => {
        return a.gt(b) ? 1 : -1
      })[0]
    })
    .map(number => number.div(GWEI_BN).toNumber())

    const percentileNum = percentile(65, lowestPrices)
    const percentileNumBn = new BN(percentileNum)
    return '0x' + percentileNumBn.mul(GWEI_BN).toString(16)
  }

  async queryRecentBlocks () {
    const blockNumberHex = await this.blockTracker.getLatestBlock()
    const currentBlockNumber = Number.parseInt(blockNumberHex, 16)
    const blocksToFetch = Math.min(currentBlockNumber, this.historyLength)
    const prevBlockNumber = currentBlockNumber - 1
    const targetBlockNumbers = Array(blocksToFetch).fill().map((_, index) => prevBlockNumber - index)
    const rawRecentBlocks = await Promise.all(targetBlockNumbers.map(async (targetBlockNumber) => {
      try {
        return await this.getBlockByNumber(targetBlockNumber, true)
      } catch (err) {
        return null
      }
    }))
    const recentBlocks = rawRecentBlocks
      .filter(Boolean)
      .map(analyzeBlockGasPrices)
    return recentBlocks
  }

  /**
   * Receives a block and gets the gasPrice of each of its transactions. These gas prices are added to the block at a
   * new property, and the block's transactions are removed.
   *
   * @param {object} newBlock The block to modify. It's transaction array will be replaced by a gasPrices array.
   * @returns {object} The modified block.
   *
   */
  analyzeBlockGasPrices (newBlock) {
    const block = extend(newBlock, {
      gasPrices: newBlock.transactions.map((tx) => {
        return tx.gasPrice
      }),
    })
    delete block.transactions
    return block
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
