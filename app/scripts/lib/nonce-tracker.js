const EthQuery = require('eth-query')
const assert = require('assert')

class NonceTracker {

  constructor ({ blockTracker, provider, getPendingTransactions }) {
    this.blockTracker = blockTracker
    this.ethQuery = new EthQuery(provider)
    this.getPendingTransactions = getPendingTransactions
    this.lockMap = {}
  }

  // releaseLock must be called
  // releaseLock must be called after adding signed tx to pending transactions (or discarding)
  async getNonceLock (address) {
    // await lock free
    await this.lockMap[address]
    // take lock
    const releaseLock = this._takeLock(address)
    // calculate next nonce
    // we need to make sure our base count
    // and pending count are from the same block
    const currentBlock = await this._getCurrentBlock()
    const pendingTransactions = this.getPendingTransactions(address)
    const pendingCount = pendingTransactions.length
    assert(Number.isInteger(pendingCount), 'nonce-tracker - pendingCount is an integer')
    const baseCountHex = await this._getTxCount(address, currentBlock)
    const baseCount = parseInt(baseCountHex, 16)
    assert(Number.isInteger(baseCount), 'nonce-tracker - baseCount is an integer')
    const nextNonce = baseCount + pendingCount
    assert(Number.isInteger(nextNonce), 'nonce-tracker - nextNonce is an integer')
    // return next nonce and release cb
    return { nextNonce, releaseLock }
  }

  async _getCurrentBlock () {
    const currentBlock = this.blockTracker.getCurrentBlock()
    if (currentBlock) return currentBlock
    return await Promise((reject, resolve) => {
      this.blockTracker.once('latest', resolve)
    })
  }

  _takeLock (lockId) {
    let releaseLock = null
    // create and store lock
    const lock = new Promise((resolve, reject) => { releaseLock = resolve })
    this.lockMap[lockId] = lock
    // setup lock teardown
    lock.then(() => delete this.lockMap[lockId])
    return releaseLock
  }

  async _getTxCount (address, currentBlock) {
    const blockNumber = currentBlock.number
    return new Promise((resolve, reject) => {
      this.ethQuery.getTransactionCount(address, blockNumber, (err, result) => {
        err ? reject(err) : resolve(result)
      })
    })
  }

}

module.exports = NonceTracker
