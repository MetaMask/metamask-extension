const EthQuery = require('eth-query')

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
    const baseCount = await this._getTxCount(address, currentBlock)
    const nextNonce = parseInt(baseCount) + pendingTransactions.length
    // return next nonce and release cb
    return { nextNonce: nextNonce.toString(16), releaseLock }
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
