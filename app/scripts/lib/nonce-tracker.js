const EthQuery = require('ethjs-query')

class NonceTracker {

  constructor({ blockTracker, provider, getPendingTransactions }) {
    this.blockTracker = blockTracker
    this.ethQuery = new EthQuery(provider)
    this.getPendingTransactions = getPendingTransactions
    this.lockMap = {}
  }

  // releaseLock must be called
  // releaseLock must be called after adding signed tx to pending transactions (or discarding)
  async getNonceLock(address) {
    // await lock free
    await this.lockMap[address]
    // take lock
    const releaseLock = this._takeLock(address)
    // calculate next nonce
    const currentBlock = await this._getCurrentBlock()
    const blockNumber = currentBlock.number
    const pendingTransactions = this.getPendingTransactions(address)
    const baseCount = await this.ethQuery.getTransactionCount(address, blockNumber)
    const nextNonce = baseCount + pendingTransactions
    // return next nonce and release cb
    return { nextNonce, releaseLock }
  }

  async _getCurrentBlock() {
    const currentBlock = this.blockTracker.getCurrentBlock()
    if (currentBlock) return currentBlock
    return await Promise((reject, resolve) => {
      this.blockTracker.once('latest', resolve)
    })
  }

  _takeLock(lockId) {
    let releaseLock = null
    // create and store lock
    const lock = new Promise((reject, resolve) => { releaseLock = resolve })
    this.lockMap[lockId] = lock
    // setup lock teardown
    lock.then(() => delete this.lockMap[lockId])
    return releaseLock
  }

}

module.exports = NonceTracker
